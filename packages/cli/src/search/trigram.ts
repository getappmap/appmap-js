import { normalizeSQL } from '@appland/models';
import { Fqid, IndexCodeObject, IndexEvent } from './types';

const normalizeId = (coid: Fqid, evt: IndexEvent): Fqid => {
  if (coid?.type === 'query') {
    return new Fqid('query', normalizeSQL(evt.sql.sql, evt.sql.database_type));
  }

  return coid;
};

class Trigram {
  constructor(
    public caller: IndexEvent | undefined,
    public event: IndexEvent,
    public callee: IndexEvent | undefined,
    public codeObjectFn: (event: IndexEvent) => Fqid | undefined
  ) {}

  get id(): string {
    return [this.callerId, this.codeObjectId, this.calleeId].join(' -> ');
  }

  get callerId(): string | undefined {
    if (!this.caller) return;

    return this.codeObjectFn(this.caller)?.toString();
  }

  get codeObjectId(): string | undefined {
    const coid = this.codeObjectFn(this.event);
    if (coid) {
      return normalizeId(coid, this.event).toString();
    }
  }

  get calleeId(): string | undefined {
    if (!this.callee) return;

    const co = this.codeObjectFn(this.callee);
    if (co) {
      return normalizeId(co, this.callee).toString();
    }
  }
}

export default function buildTrigrams(
  callerEvent: IndexEvent | undefined,
  event: IndexEvent,
  calleeEvent: IndexEvent | undefined
): { functionTrigram: Trigram; classTrigram: Trigram; packageTrigram: Trigram } {
  const codeObjectFn = (evt: IndexEvent): Fqid | undefined => evt?.codeObjectIds[0];
  const classFn = (evt: IndexEvent): Fqid | undefined => evt?.codeObjectIds[1];
  const packageFn = (evt: IndexEvent): Fqid | undefined => {
    if (!evt) {
      return;
    }

    return evt.codeObjectIds.find((fqid) => fqid.type === 'package');
  };

  return {
    functionTrigram: new Trigram(callerEvent, event, calleeEvent, codeObjectFn),
    classTrigram: new Trigram(callerEvent, event, calleeEvent, classFn),
    packageTrigram: new Trigram(callerEvent, event, calleeEvent, packageFn),
  };
}
