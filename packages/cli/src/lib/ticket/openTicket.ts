import chalk from 'chalk';
import { HttpError } from '../../cmds/errors';
import UI from '../../cmds/userInteraction';
import Telemetry from '../../telemetry';
import createZendeskRequest from './zendesk';

export default async function openTicket(
  errors: string | string[],
  helpMsg: string = ''
): Promise<void> {
  UI.progress(
    [
      `Help is available from the AppMap support team!${helpMsg} The AppMap team will respond to you by email, so we'll need your
email address to open the support request.
`,
    ].join('\n')
  );
  const message = `Would you like to open a support request?`;
  const { email, openTicket } = await UI.prompt({
    type: 'confirm',
    name: 'openTicket',
    default: true,
    message,
    prefix: chalk.red('!'),
  }).then(async (answers) => {
    if (!answers.openTicket) {
      UI.progress(
        [
          `
You've elected not to open a support request for this problem.

If you change your mind, you can always reach us by email: support@appmap.io
`,
        ].join('\n')
      );

      Telemetry.sendEvent({
        name: 'open-ticket:declined',
      });

      return { openTicket: false };
    }

    const { email } = await UI.prompt([
      {
        name: 'email',
        message:
          'Please provide your email address, so that we can contact you with a response:',
        validate: (v) =>
          v.trim().length > 0 || 'Please enter your email address',
      },
    ]);
    return {
      email,
      openTicket: true,
    };
  });

  if (!openTicket) {
    return;
  }

  try {
    const id = await createZendeskRequest(errors, email);
    Telemetry.sendEvent({
      name: 'open-ticket:success',
    });
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
      eventName = `open-ticket:${
        he.response?.status === 429 ? 'rate-limit' : 'error'
      }`;
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
