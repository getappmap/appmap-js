export enum CodeEditor {
  VSCode = 'vscode',
  JetBrains = 'jetbrains',
}

export default function detectCodeEditor(): CodeEditor | undefined {
  const termProgram = process.env.TERM_PROGRAM;
  if (termProgram === 'vscode') return CodeEditor.VSCode;

  const terminalEmulator = process.env.TERMINAL_EMULATOR;
  if (terminalEmulator?.toLowerCase().includes('jetbrains')) return CodeEditor.JetBrains;
}
