import { ParameterObject } from '@appland/models';
import { messageToOpenAPISchema } from './util';

export default class Schema {
  examples: ParameterObject[];

  constructor() {
    this.examples = [];
  }

  addExample(message: ParameterObject): void {
    if (!message.name) {
      return;
    }
    this.examples.push(message);
  }

  get empty(): boolean {
    return this.examples.length > 0;
  }

  schema(): any {
    const properties: Record<string, any> = {};
    this.examples
      .sort((a, b) => a.name!.localeCompare(b.name!))
      .forEach((message) => {
        if (properties[message.name!]) {
          return;
        }
        properties[message.name!] = messageToOpenAPISchema(message);
      });
    if (Object.keys(properties).length === 0) {
      return null;
    }

    return {
      type: 'object',
      properties,
    };
  }
}
