import {
  DiffOptions,
  MoveType,
  Diagram,
  diff,
  buildDiffDiagram,
  Action,
} from '@appland/sequence-diagram';
import { verbose } from '../utils';
import { buildActionName } from './buildActionName';

const UniqueActionNames = new Set<string>();

class IncludeFilter {
  expressions: RegExp[] = [];

  addExpression(expression: string) {
    this.expressions.push(new RegExp(expression));
  }

  test(action: Action): boolean {
    if (this.expressions.length === 0) return true;

    let ancestor: Action | undefined = action;
    while (ancestor) {
      const actionName = buildActionName(ancestor);
      if (verbose()) {
        if (actionName && !UniqueActionNames.has(actionName)) {
          console.log(`Testing action: ${actionName}`);
          UniqueActionNames.add(actionName);
        }
      }
      if (actionName) {
        if (this.expressions.find((expr) => expr.test(actionName))) {
          return true;
        }
      }
      ancestor = ancestor.parent;
    }

    return false;
  }
}

export class ExcludeFilter {
  expressions: RegExp[] = [];

  addExpression(expression: string) {
    this.expressions.push(new RegExp(expression));
  }

  test(action: Action): boolean {
    const actionName = buildActionName(action);
    if (!actionName) return true;

    return this.expressions.find((expr) => expr.test(actionName)) === undefined;
  }
}

export class DiffDiagrams {
  includeFilter: IncludeFilter;
  excludeFilter: ExcludeFilter;

  constructor() {
    this.includeFilter = new IncludeFilter();
    this.excludeFilter = new ExcludeFilter();
  }

  include(expr: string): void {
    this.includeFilter.addExpression(expr);
  }

  exclude(expr: string): void {
    this.excludeFilter.addExpression(expr);
  }

  diff(base: Diagram, head: Diagram): Diagram | undefined {
    return this.diffDiagrams(this.filterDiagram(base), this.filterDiagram(head));
  }

  protected filterDiagram(diagram: Diagram): Diagram {
    const filterActions = (actions: Action[]): Action[] => {
      const result = actions.filter(
        (action) => this.includeFilter.test(action) && this.excludeFilter.test(action)
      );
      result.forEach((action) => {
        action.children = filterActions(action.children);
      });
      return result;
    };

    diagram.rootActions = filterActions(diagram.rootActions);
    return diagram;
  }

  protected diffDiagrams(base: Diagram, head: Diagram): Diagram | undefined {
    const result = diff(base, head, {} as DiffOptions);

    const changes = result.moves.filter((move) => move.moveType !== MoveType.AdvanceBoth);
    if (changes.length === 0) {
      return;
    }

    return buildDiffDiagram(result);
  }
}
