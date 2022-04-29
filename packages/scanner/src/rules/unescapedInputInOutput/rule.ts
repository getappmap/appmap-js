import { Event, EventNavigator } from '@appland/models';
import { MatchResult, RuleLogic } from 'src/types';

function matcher(httpServerRequest: Event): MatchResult[] | undefined {
  if (!httpServerRequest.message) return;

  const parameters = httpServerRequest.message.filter(
    (message) => message.name && !['controller', 'action'].includes(message.name)
  );

  const result: MatchResult[] = [];
  for (const event of new EventNavigator(httpServerRequest).descendants()) {
    if (!event.event.codeObject.labels.has('mvc.render')) continue;
    if (!event.event.returnEvent) continue;
    if (!event.event.returnValue) continue;

    const output = event.event.returnValue;
    parameters
      .filter((parameter) => output.value.includes(parameter.value))
      .forEach((parameter) => {
        if (!parameter.name) return;

        result.push({
          event: event.event,
          message: `mvc.render output contains parameter '${parameter.name}' value '${parameter.value}'`,
          relatedEvents: [httpServerRequest],
          properties: {
            parameter: { name: parameter.name, value: parameter.value },
          },
        });
      });
  }
  return result;
}

export default function rule(): RuleLogic {
  return {
    matcher,
    where: (e: Event) => !!e.httpServerResponse,
  };
}
