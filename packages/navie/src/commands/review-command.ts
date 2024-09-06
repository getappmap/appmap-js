import Command, { CommandRequest } from '../command';
import ReviewService, { ChangeSummary } from '../services/review-service';

export default class ReviewCommand implements Command {
  constructor(private readonly reviewService: ReviewService) {}

  async *execute({ question, userOptions }: CommandRequest): AsyncIterable<string> {
    const changeSummary = JSON.parse(question) as ChangeSummary;
    const responseFormat = userOptions.stringValue('format', 'markdown');
    const review = await this.reviewService.performReview(changeSummary, 8.0, responseFormat);
    yield review;
  }
}
