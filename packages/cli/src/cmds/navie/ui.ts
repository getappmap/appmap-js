import { text } from 'stream/consumers';
import { INavieProvider } from '../../rpc/explain/navie/inavie';
import { explainHandler } from '../../rpc/explain/explain';

export default class UI {
  constructor(private capturingProvider: INavieProvider, private codeEditor: string) {}

  async run(question?: string, codeSelection?: string, prompt?: string): Promise<void> {
    const initialQuestion = question ?? (await this.getQuestion());

    const response = await explainHandler(this.capturingProvider, this.codeEditor).handler({
      question: initialQuestion,
      codeSelection,
      prompt,
    });

    process.stdout.write(JSON.stringify(response));
  }

  private async getQuestion(): Promise<string> {
    // Obtain question from the user via stdin
    process.stdout.write('Enter your question (end with Ctrl-D): ');
    return await text(process.stdin);
  }
}
