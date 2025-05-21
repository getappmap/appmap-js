import Handlebars from 'handlebars';
import stackInline from '../../resources/inlines/stack.hbs';

export default function compileTemplate(template: string): HandlebarsTemplateDelegate {
  return Handlebars.compile([stackInline, template].join('\n'));
}
