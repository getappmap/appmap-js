import { normalizeSQL } from '@appland/models';
import { IndexCodeObject, Event } from './types';

const normalizeId = (co: IndexCodeObject, evt: Event): string => {
  if (co && co.type === 'query') {
    return ['query', normalizeSQL(evt.sqlQuery, evt.sql.database_type)].join(':');
  }

  return co.fqid;
};

class Trigram {
  constructor(
    public caller: Event | undefined,
    public event: Event,
    public callee: Event | undefined,
    public codeObjectFn: (event: Event) => IndexCodeObject | undefined
  ) {}

  get id(): string {
    return [this.callerId, this.codeObjectId, this.calleeId].join(' -> ');
  }

  get callerId(): string | undefined {
    if (!this.caller) return;

    const co = this.codeObjectFn(this.caller);
    if (co) return co.fqid;
  }

  get codeObjectId(): string | undefined {
    const co = this.codeObjectFn(this.event);
    if (co) {
      return normalizeId(co, this.event);
    }
  }

  get calleeId(): string | undefined {
    if (!this.callee) return;

    const co = this.codeObjectFn(this.callee);
    if (co) {
      return normalizeId(co, this.callee);
    }
  }
}

export default function buildTrigrams(
  callerEvent: Event | undefined,
  event: Event,
  calleeEvent: Event | undefined
): { functionTrigram: Trigram; classTrigram: Trigram; packageTrigram: Trigram } {
  const codeObjectFn = (evt: Event): IndexCodeObject | undefined => evt?.codeObject;
  const classFn = (evt: Event): IndexCodeObject | undefined => evt?.codeObject.parent;
  const packageFn = (evt: Event): IndexCodeObject | undefined => {
    if (!evt) {
      return;
    }

    const findPackage = (codeObject: IndexCodeObject): IndexCodeObject => {
      if (codeObject.type === 'package' || !codeObject.parent) {
        return codeObject;
      }

      return findPackage(codeObject.parent);
    };
    return findPackage(evt.codeObject);
  };

  return {
    functionTrigram: new Trigram(callerEvent, event, calleeEvent, codeObjectFn),
    classTrigram: new Trigram(callerEvent, event, calleeEvent, classFn),
    packageTrigram: new Trigram(callerEvent, event, calleeEvent, packageFn),
  };
}
