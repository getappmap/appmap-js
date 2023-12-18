import chalk from 'chalk';
import { SearchRpc } from '@appland/rpc';
import { handler as searchHandler } from '../search/search';

export default async function search(
  appmapDir: string,
  vectorTerms: string[],
  numSearchResults = 10
): Promise<SearchRpc.SearchResponse> {
  const searchResponse = await searchHandler(appmapDir, vectorTerms.join(' '), {
    maxResults: numSearchResults,
  });
  console.log(chalk.gray(`Obtained ${searchResponse.results.length} results`));

  for (const result of searchResponse.results) {
    console.log(chalk.gray(`AppMap: ${result.appmap}`));
  }

  return searchResponse;
}
