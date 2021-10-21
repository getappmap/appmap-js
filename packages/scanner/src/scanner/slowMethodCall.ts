import { Event } from '@appland/models';
import Assertion from '../assertion';
import { toRegExp } from './util';

class Options {
  private _classNameRegExp: RegExp;
  private _methodNameRegExp: RegExp;

  constructor(public timeAllowed = 0.1, className: string | RegExp, methodName: string | RegExp) {
    this._classNameRegExp = toRegExp(className);
    this._methodNameRegExp = toRegExp(methodName);
  }

  get className(): RegExp {
    return this._classNameRegExp;
  }

  set className(pattern: string | RegExp) {
    this._classNameRegExp = toRegExp(pattern);
  }

  get methodName(): RegExp {
    return this._methodNameRegExp;
  }

  set methodName(pattern: RegExp) {
    this._methodNameRegExp = toRegExp(pattern);
  }
}

function scanner(options: Options): Assertion {
  return Assertion.assert(
    'slow-method-call',
    'Slow method calls',
    (e: Event) => e.returnEvent.elapsedTime! > options.timeAllowed,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        e.isFunction &&
        !!e.returnEvent &&
        !!e.returnEvent.elapsedTime &&
        !!e.definedClass &&
        !!e.methodId &&
        options.className.test(e.definedClass) &&
        options.methodName.test(e.methodId);
      assertion.description = `Slow method call (> ${options.timeAllowed * 1000}ms)`;
    }
  );
}

export default { scope: `command`, enumerateScope: true, Options, scanner };
