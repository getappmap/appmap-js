import chalk from 'chalk';
import { HttpError } from '../../cmds/errors';
import UI from '../../cmds/userInteraction';
import Telemetry from '../../telemetry';
import { createRequest as createZendeskRequest } from './zendesk';

export async function openTicket(errors: string[]): Promise<void> {
  const message = `
Would you like to submit a support request to the AppMap team to get help with this problem?
`;
  const { name, email, openTicket } = await UI.prompt({
    type: 'confirm',
    name: 'openTicket',
    default: true,
    message,
    prefix: chalk.red('!'),
  }).then(async (answers) => {
    if (!answers.openTicket) {
      Telemetry.sendEvent({
        name: 'open-ticket:declined',
      });

      return { openTicket: false };
    }

    const { name, email } = await UI.prompt([
      {
        name: 'name',
        message: 'Your name',
        validate: (v) => {
          return v.trim().length > 0 || 'Please enter your name';
        },
      },
      {
        name: 'email',
        message: 'Your email address',
        validate: (v) =>
          v.trim().length > 0 || 'Please enter your email address',
      },
    ]);
    return {
      name,
      email,
      openTicket: true,
    };
  });

  if (!openTicket) {
    return;
  }

  try {
    const id = await createZendeskRequest(errors, email, name);
    Telemetry.sendEvent({
      name: 'open-ticket:success',
    });
    UI.success(
      `Ticket ${id} was successfully opened on your behalf.

Thank you very much for reporting this error.
Please check your email for next steps.`,
      'left'
    );
  } catch (e) {
    const he = e as HttpError;
    const response = he.response;
    let name: string;
    let error: string | undefined = undefined;
    if (response) {
      name = `open-ticket:${
        he.response?.status === 429 ? 'rate-limit' : 'error'
      }`;
      error = response.toString();
    } else {
      name = 'open-ticket:no-response';
    }
    Telemetry.sendEvent({
      name,
      properties: {
        error,
      },
    });
    UI.error(
      `${chalk.red('!')} A failure occurred attempting to create a ticket.

${chalk.red('!')} This failure has been reported to AppLand.`
    );
  }
}
