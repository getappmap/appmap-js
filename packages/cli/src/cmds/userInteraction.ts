import inquirer, { QuestionCollection } from 'inquirer';
import ora, { Ora } from 'ora';
import boxen from 'boxen';
import { verbose } from '../utils';

interface SpinnerOptions {
  supressSpinner?: boolean;
}

export class UserInteraction {
  private spinner: Ora = ora();

  async prompt(questions: QuestionCollection, opts?: SpinnerOptions) {
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

  async confirm(msg: string) {
    await inquirer.prompt({ type: 'input', name: 'confirm', message: msg });
  }

  progress(msg: string) {
    console.log(msg);
  }

  success(msg?: string) {
    if (this.spinner.isSpinning) {
      this.spinner.succeed();
    }

    if (msg) {
      console.log(
        boxen(msg, {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          align: 'center',
        })
      );
    }
  }

  error(msg?: any) {
    if (this.spinner.isSpinning) {
      this.spinner.fail();
    }

    if (msg) {
      console.error('');
      console.error(msg);
    }
  }

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
