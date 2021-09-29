import { Event, EventNavigator } from '@appland/models';
import Assertion from '../assertion';

const validatedBy = (iterator: Iterator<EventNavigator>): boolean => {
  let i: IteratorResult<EventNavigator> = iterator.next();
  while (!i.done) {
    if (
      i.value.event.methodId !== undefined &&
      ['valid?', 'validate'].includes(i.value.event.methodId!)
    ) {
      return true;
    }
    i = iterator.next();
  }

  return false;
};

export default function (): Assertion {
  return Assertion.assert(
    'validate-before-save',
    '`save` calls without validation',
    'function',
    // TODO: ensure that the object id on the 'validate' is the same as the object id on the 'save'
    // TODO: if validate happens in a preceding event, this is also OK
    (event: Event) => !validatedBy(new EventNavigator(event).descendants()),
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => ['save', 'save!'].includes(e.methodId!);
      assertion.description = `'save' must be preceded by 'valid?' or 'validate'`;
    }
  );
}
