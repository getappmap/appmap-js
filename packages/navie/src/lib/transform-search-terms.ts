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
    result = [aggregateQuestion];
  }

  result = result
    .map((term) => term.trim().split(/\s+/))
    .flat()
    .filter(Boolean);

  if (result.length === 0) warn('No search terms were generated.');

  return result;
}
