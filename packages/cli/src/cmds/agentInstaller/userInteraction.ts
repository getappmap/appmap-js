import inquirer, { QuestionCollection } from 'inquirer';
import ora, { Ora } from 'ora';
import boxen from 'boxen';
import { verbose } from '../../utils';

export class UserInteraction {
  private spinner: Ora = ora();

  async prompt(questions: QuestionCollection) {
    const wasSpinning = this.spinner.isSpinning;
    if (wasSpinning) {
      this.spinner.stop();
      this.spinner.clear();
    }

    const result = await inquirer.prompt(questions);

    if (wasSpinning) {
      this.spinner.start();
    }

    return result;
  }

  success(msg: string) {
    if (this.spinner.isSpinning) {
      this.spinner.succeed();
    }

    console.log(
      boxen(msg, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        align: 'center',
      })
    );
  }

  error(msg?: any) {
    if (this.spinner.isSpinning) {
      this.spinner.fail();
    }

    if (msg) {
      console.error('\n', msg);
    }
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
