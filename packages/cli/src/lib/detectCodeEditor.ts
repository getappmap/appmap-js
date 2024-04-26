export enum CodeEditor {
  VSCode = 'vscode',
  JetBrains = 'jetbrains',
}

export default function detectCodeEditor(): string | undefined {
  const editor = process.env.APPMAP_CODE_EDITOR;
  if (editor) return editor;

  const termProgram = process.env.TERM_PROGRAM;
  if (termProgram === 'vscode') return CodeEditor.VSCode;

  const terminalEmulator = process.env.TERMINAL_EMULATOR;
  if (terminalEmulator?.toLowerCase().includes('jetbrains')) return CodeEditor.JetBrains;
}
