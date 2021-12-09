import { Event } from '@appland/models';
import { emptyValue, verbose } from '../rules/util';

export default function (secrets: Set<string>, e: Event): void {
  if (!e.returnValue) {
    return;
  }
  if (emptyValue(e.returnValue.value)) {
    return;
  }
  if (verbose()) {
    console.warn(`Secret generated: ${e.returnValue.value}`);
  }
  secrets.add(e.returnValue.value);
}
