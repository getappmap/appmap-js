import { Event } from '@appland/models';
import { emptyValue, parseValue, verbose } from '../rules/lib/util';

export default function (secrets: Set<string>, e: Event): void {
  if (!e.returnValue) {
    return;
  }
  if (emptyValue(e.returnValue.value)) {
    return;
  }
  // For example, from Devise:
  // {"class":"Array","value":"[LoDbrVENxPDM3x9ySf1y, 706d0455f6ca78e6f61609e8146a76729ceca01b7e95ed0ac49d416e3e8be39a]"
  for (const secret of parseValue(e.returnValue)) {
    if (verbose()) {
      console.warn(`Secret generated: ${secret}`);
    }
    secrets.add(secret);
  }
}
