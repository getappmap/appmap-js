import Assertion from "../assertion";
import {AppMapData} from "../../../appland/types";
import chalk from "chalk";

export default abstract class Formatter {
  abstract appMap(appMap: AppMapData): string;
  abstract result(assertion: Assertion, result: Boolean | null, index: number): string;

  summary(passed: number, skipped: number, failed: number): string {
    const total = passed + skipped + failed;
    const passedStr = passed > 0 ? chalk.green(`${passed} passed`) : '';
    const skippedStr = skipped > 0 ? chalk.blue(`${skipped} skipped`) : '';
    const failedStr = failed > 0 ? chalk.red(`${failed} failed`) : '';

    return `${total} assertions (${[passedStr, failedStr, skippedStr].join(', ')})`;
  }
}
