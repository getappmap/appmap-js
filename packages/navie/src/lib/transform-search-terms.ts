import { warn } from 'console';
import VectorTermsService from '../services/vector-terms-service';

export default async function transformSearchTerms(
  transformTerms: boolean,
  aggregateQuestion: string,
  vectorTermsService: VectorTermsService
): Promise<string[]> {
  let result: string[];
  if (transformTerms) {
    result = await vectorTermsService.suggestTerms(aggregateQuestion);
  } else {
    const terms = new Array<string>();
    for (const term of aggregateQuestion.split(/[._-\s]/))
      terms.push(term.match(/\+?[\p{Alphabetic}|\p{Number}]+/u)?.[0] || '');
    result = terms
      .map((word) => word.trim())
      .filter((word) => word.length > 2)
      .map((word) => word.toLowerCase());
  }

  if (result.length === 0) {
    warn('No search terms were generated.');
  } else {
    warn(`Transformed search terms: ${result.join(' ')}`);
  }

  return result;
}
