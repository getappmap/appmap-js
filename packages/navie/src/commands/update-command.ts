import Command, { CommandRequest } from '../command';
import InteractionHistory from '../interaction-history';
import ComputeUpdateService from '../services/compute-update-service';

export default class UpdateCommand implements Command {
  constructor(
    private readonly history: InteractionHistory,
    public computeUpdateService: ComputeUpdateService
  ) {}

  async *execute(request: CommandRequest): AsyncIterable<string> {
    const { question, codeSelection } = request;

    if (!question) {
      this.history.log(`No question found in request: ${JSON.stringify(request)}`);
      return;
    }
    if (!codeSelection) {
      this.history.log(`No code selection found in request: ${JSON.stringify(request)}`);
      return;
    }

    const existingContent = codeSelection;
    if (typeof existingContent !== 'string') {
      throw new Error('unimplemented');
    }

    const newContent = question;
    const update = await this.computeUpdateService.computeUpdate(existingContent, newContent);

    if (update) yield JSON.stringify(update, null, 2);
  }
}
