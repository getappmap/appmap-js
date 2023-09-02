import {
  ValidationResult,
  Actor,
  Action,
  isLoop,
  NodeType,
  isFunction,
  isServerRPC,
  isClientRPC,
  isQuery,
} from './types';

export default function validateDiagram(diagramData: any): ValidationResult {
  // Check if it's likely an AppMap object
  if (
    diagramData &&
    diagramData.hasOwnProperty('metadata') &&
    diagramData.hasOwnProperty('classMap') &&
    diagramData.hasOwnProperty('events')
  ) {
    return ValidationResult.AppMap;
  }

  if (!Array.isArray(diagramData.actors) || !Array.isArray(diagramData.rootActions)) {
    console.error('Invalid Diagram: actors and rootActions must be arrays.');
    return ValidationResult.Invalid;
  }

  const validateActor = (actor: any): actor is Actor => {
    if (
      typeof actor.id !== 'string' ||
      typeof actor.name !== 'string' ||
      typeof actor.order !== 'number'
    ) {
      console.error('Invalid Actor:', actor);
      return false;
    }
    return true;
  };

  const validateAction = (action: any): action is Action => {
    if (
      !action ||
      !Object.values(NodeType).includes(action.nodeType) ||
      typeof action.digest !== 'string' ||
      !Array.isArray(action.children) ||
      !Array.isArray(action.eventIds)
    ) {
      console.error('Invalid Action:', action);
      return false;
    }

    // Validate children recursively
    for (const child of action.children) {
      if (!validateAction(child)) {
        return false;
      }
    }

    // Validate specific nodeType cases
    if (isLoop(action) && typeof action.count !== 'number') {
      console.error('Invalid Loop:', action);
      return false;
    }

    if (
      (isFunction(action) || isServerRPC(action) || isClientRPC(action) || isQuery(action)) &&
      typeof action.callee !== 'string'
    ) {
      console.error(`Invalid ${NodeType[action.nodeType]}:`, action);
      return false;
    }

    return true;
  };

  for (const actor of diagramData.actors) {
    if (!validateActor(actor)) {
      return ValidationResult.Invalid;
    }
  }

  for (const action of diagramData.rootActions) {
    if (!validateAction(action)) {
      return ValidationResult.Invalid;
    }
  }

  return ValidationResult.Valid;
}
