import inquirer, { QuestionCollection } from 'inquirer';
import ora, { Ora } from 'ora';
import boxen from 'boxen';
import { verbose } from '../utils';
import { AbortError } from './errors';

export class UserInteraction {
  private spinner: Ora = ora();

  async prompt(questions: QuestionCollection): Promise<inquirer.Answers> {
    return new Promise(async (resolve, reject) => {
      const wasSpinning = this.spinner.isSpinning;
      if (wasSpinning) {
        this.spinner.stop();
        this.spinner.clear();
      }

      // Inquirer overrides process.on('SIGINT'), so this is a workaround
      process.stdin.on('data', (buf) => {
        if (buf.toString().endsWith('\u0003')) {
          reject(new AbortError('user exited via Ctrl+C'));
        }
      });

      const result = await inquirer.prompt(questions, { input: process.stdin });

      if (wasSpinning) {
        this.spinner.start();
      }

      resolve(result);
    });
  }

  progress(msg: string) {
    console.log(msg);
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
