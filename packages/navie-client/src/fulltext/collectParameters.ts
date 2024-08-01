import { Event, ParameterObject, ParameterProperty } from '@appland/models';

export function collectParameters(event: Event): string[] {
  const result = new Array<string>();
  if (event.parameters) collectParameterNames(event.parameters, result);
  if (event.message) collectProperties(event.message, result);
  return result;
}

export function collectParameterNames(
  parameters: readonly ParameterObject[],
  result: string[] = []
) {
  parameters.forEach((parameter) => (parameter.name ? result.push(parameter.name) : undefined));
  return result;
}

export function collectProperties(properties: readonly ParameterProperty[], result: string[] = []) {
  for (const property of properties) {
    if (property.name) {
      result.push(property.name);
    }
    if (property.items) {
      collectProperties(property.items, result);
    }
    if (property.properties) {
      collectProperties(property.properties, result);
    }
  }
  return result;
}
