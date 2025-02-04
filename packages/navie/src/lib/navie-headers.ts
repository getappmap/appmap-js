import { randomUUID } from 'crypto';
import { NavieOptions } from '../navie';
import { CommandMode } from '../command';
import InteractionHistory, { ContextLookupEvent, InteractionEvent } from '../interaction-history';
import { ContextV2 } from '../context';

export interface NavieRequestMetadata {
  // The name of the product making the request, e.g. "AppMap".
  product?: string;

  // The version of the product making the request, e.g. "1.0.0".
  version?: string;

  // The code editor which owns the process making the request, e.g. "vscode".
  codeEditor?: string;

  // Information about the model used to generate the response.
  model?: {
    name?: string;
  };

  // The @-command requested by the user.
  command?: string;
}

export class NavieHeaders {
  public readonly requestId = randomUUID();
  private readonly metadata: NavieRequestMetadata;
  private appmapReferences = new Set<string>();

  constructor(interactionHistory: InteractionHistory, options: NavieOptions, command: CommandMode) {
    this.metadata = options.metadata ?? {};
    this.metadata.model ||= {};
    this.metadata.model.name = options.modelName;
    this.metadata.command = command;

    interactionHistory.on('event', (event: InteractionEvent) => {
      if (event.type === 'contextLookup') {
        const contextLookupEvent = event as ContextLookupEvent;
        contextLookupEvent.context?.filter(ContextV2.isAppMapContextItem).forEach((contextItem) => {
          this.appmapReferences.add(contextItem.location);
        });
      }
    });
  }

  buildHeaders(): Record<string, string> {
    const platform = `${process.platform}-${process.arch}`;
    const nodeVersion = `${process.release.name} ${process.versions.node}`;
    const product = [this.metadata.product, this.metadata.version].filter(Boolean).join('/');
    const userAgent = [product, `(${platform}; ${nodeVersion})`, this.metadata.codeEditor]
      .filter(Boolean)
      .join(' ');

    return Object.entries({
      'user-agent': userAgent,
      'x-appmap-navie-request-id': this.requestId,
      'x-appmap-navie-model': this.metadata.model?.name,
      'x-appmap-navie-runtime-refs': this.appmapReferences.size,
      'x-appmap-navie-command': this.metadata.command,
    })
      .filter((e): e is [string, string] => e[1] !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {});
  }
}
