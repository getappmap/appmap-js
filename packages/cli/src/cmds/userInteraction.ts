import boxen from 'boxen';
import inquirer, { Answers, QuestionCollection } from 'inquirer';
import ora, { Ora } from 'ora';
import { verbose } from '../utils';

interface SpinnerOptions {
  supressSpinner?: boolean;
}

export class UserInteraction {
  private spinner: Ora = ora();

  async prompt(questions: QuestionCollection, opts?: SpinnerOptions): Promise<Answers> {
    const wasSpinning = this.spinner.isSpinning;
    if (wasSpinning) {
      this.spinner.stop();
      this.spinner.clear();
    }

    const result = await inquirer.prompt(questions);

    if (wasSpinning && !opts?.supressSpinner) {
      this.spinner.start();
    }

    return result;
  }

  async continue(msg: string): Promise<void> {
    await inquirer.prompt({ type: 'input', name: 'confirm', message: msg });
  }

  async confirm(msg: string): Promise<boolean> {
    const { confirm } = await inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message: msg,
    });
    return confirm;
  }

  /**
   * Prints a message to STDOUT.
   */
  progress(msg: string) {
    console.log(msg);
  }

  /**
   * Finishes an in-progress command, showing a success indicator at the beginning of the line.
   * Prints an optional message inside of a box.
   */
  success(msg?: string, align: 'center' | 'left' | 'right' = 'center') {
    if (this.spinner.isSpinning) {
      this.spinner.succeed();
    }

    if (msg) {
      console.log(
        boxen(msg, {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          textAlignment: align,
        })
      );
    }
  }

  /**
   * Halts an in-progress command, showing a failure indicator at the beginning of the line.
   * Prints an optional error message to
   */
  error(msg?: any) {
    if (this.spinner.isSpinning) {
      this.spinner.fail();
    }

    if (msg) {
      console.error('');
      console.error(msg);
    }
  }

  /**
   * Prints a message to STDERR.
   */
  warn(msg?: string) {
    console.error(msg);
  }

  get status(): string {
    return this.spinner.text;
  }

  set status(value: string) {
    if (this.spinner.isSpinning) {
      this.spinner.succeed();
    }

    this.spinner.text = value;
    if (!this.spinner.isSpinning && !verbose()) {
      this.spinner.start();
    }
  }
}

const UI = new UserInteraction();
export default UI;
