import chalk from 'chalk';
import { HttpError } from '../../cmds/errors';
import UI from '../../cmds/userInteraction';
import { Telemetry } from '@appland/telemetry';
import createZendeskRequest from './zendesk';
export const DEFAULT_HELP_MSG = ' ';
import { isValidEmail, isValidName } from './validation';

export default async function openTicket(
  errors: string | string[],
  helpMsg: string = DEFAULT_HELP_MSG,
  prompt = true
): Promise<void> {
  errors = !Array.isArray(errors) ? [errors] : errors;

  UI.progress(`
Help is available from the AppMap support team!${helpMsg}
`);

  if (
    await UI.confirm(`Details of the error will be provided to the support team.

Would you like to review the details here before submitting the support ticket?`)
  ) {
    UI.error(errors.join('\n'));
  }

  if (prompt) {
    const message = `Would you like to open a support request?`;
    const { openTicket } = await UI.prompt({
      type: 'confirm',
      name: 'openTicket',
      default: true,
      message,
    });

    if (!openTicket) {
      UI.progress(
        [
          `
You've elected not to open a support request for this problem.

If you change your mind, you can always reach us by email: support@appmap.io
`,
        ].join('\n')
      );

      return;
    }
  }

  UI.progress(`The AppMap team will respond to you by email. Please provide your name and email address to open the support request:
`);
  const { name, email } = await UI.prompt([
    {
      name: 'name',
      message: `Your name`,
      validate: (v) => isValidName(v) || 'Please enter your name',
    },
    {
      name: 'email',
      message: `Your email address`,
      validate: (v) => isValidEmail(v) || 'Please enter a valid email address',
    },
  ]);

  try {
    const id = await createZendeskRequest(errors, name, email);
    UI.success(
      `Thank you very much for reporting this problem.

Ticket ${id} has been successfully created on your behalf.

Please monitor your email for updates. Thank you for using AppMap!`,
      'left'
    );
  } catch (e) {
    const he = e as HttpError;
    const response = he.response;
    let eventName: string;
    let error: string | undefined = undefined;
    if (response) {
      eventName = `open-ticket:${he.response?.status === 429 ? 'rate-limit' : 'error'}`;
      error = response.toString();
    } else {
      eventName = 'open-ticket:no-response';
    }
    Telemetry.sendEvent({
      name: eventName,
      properties: {
        error,
      },
    });
    UI.error(
      `${chalk.red('!')} A failure occurred attempting to create a ticket.

${chalk.red('!')} This problem has been reported to the AppMap team.`
    );
  }
}
