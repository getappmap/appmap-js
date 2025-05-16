import chalk from 'chalk';
import { warn } from 'console';

export default function parseLocation(location: string): [string, number | undefined] | undefined {
  if (!location.includes(':')) return [location, undefined];

  const locationTest = /([^:]+):(-?\d+)$/.exec(location);
  if (!locationTest) {
    warn(chalk.gray(`Invalid location format: ${location}. Skipping file lookup.`));
    return;
  }

  const [requestedFileName, lineNoStr] = locationTest.slice(1);
  const lineNoReturned =
    lineNoStr && !lineNoStr.startsWith('-') ? parseInt(lineNoStr, 10) : undefined;
  return [requestedFileName, lineNoReturned];
}
