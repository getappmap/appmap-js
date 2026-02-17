# Navie Architecture: Lifecycle & Telemetry

> [!NOTE]
> This document is AI-generated and has been reviewed by a human.

## Overview
This document outlines the architectural separation between the Navie core logic and the CLI integration, specifically focusing on the request lifecycle and telemetry emission.

## Package Separation

### `packages/navie` (The "Brain")
- **Responsibility**: Handles prompt engineering, LLM interaction, context gathering, and command execution logic.
- **Key Interface**: `INavie` (Input: Question/Context -> Output: Token Stream + Events).
- **State**: Manages `InteractionHistory` (chat messages) but is largely driven by the `execute()` generator.
- **Telemetry**: Does **not** send telemetry directly. It emits internal events (e.g., `agent`, `classification`, `completion`) via `EventEmitter`.

### `packages/cli` (The "Body")
- **Responsibility**: Host application, RPC server, File I/O, and **Telemetry**.
- **Key File**: `packages/cli/src/rpc/explain/navie/navie-local.ts`.
- **Role**: Instantiates `Navie`, subscribes to its events, and translates the interaction into side effects (like sending telemetry to the data platform).

## Lifecycle of a Request

1. **Initialization**: `LocalNavie` (CLI) instantiates a `navie` instance via the `navie(...)` factory function.
2. **Command Selection**: Inside `packages/navie/src/navie.ts`, the input question is parsed to determine the `CommandMode` (e.g., `explain`, `welcome`, `suggest`, `review`). This is often triggered by `@` prefixes (like `@welcome`) or defaults to `explain`.
3. **Execution**: The `execute()` method on the `navie` instance is called, returning an `AsyncIterable<string>` (the token stream).
4. **Event Monitoring**: While the stream is active, `LocalNavie` listens for events emitted by the `navie` instance (e.g., `agent`, `classification`) to collect metadata.
5. **Completion & Telemetry**: Once the token stream is exhausted, `LocalNavie` calculates final metrics (duration, response length) and sends a `navie:response` telemetry event.

## Key Files

- **Command Selection**: `packages/navie/src/navie.ts` (Parses input, selects command).
- **Telemetry Sender**: `packages/cli/src/rpc/explain/navie/navie-local.ts` (Captures metrics, sends events).
- **Event Definitions**: `packages/cli/src/lib/telemetryConstants.ts`.
- **Command Definitions**: `packages/navie/src/command.ts` (Enum `CommandMode`).
