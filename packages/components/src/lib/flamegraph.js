export const add = (x, y) => x + y;

//////////////
// Constant //
//////////////

export const PADDING = 10;
export const BORDER = 1;
export const CONTENT_THRESHOLD = 2 * (PADDING + BORDER) + 10;
export const FONT_SIZE = 12;
export const HEIGHT = 2 * (BORDER + PADDING) + FONT_SIZE;

//////////////
// Duration //
//////////////

export const isEventDurationValid = ({ elapsedTime }) =>
  typeof elapsedTime === 'number' && elapsedTime >= 0;

export const getEventDuration = (event) => (isEventDurationValid(event) ? event.elapsedTime : 0);

///////////
// Style //
///////////

export const styleDimension = ({ width, height }, { border, padding }) => {
  if (height < 2 * (padding + border)) {
    throw new Error('height is too small');
  }
  const half_width = Math.floor(width / 2);
  const side_border_width = Math.min(border, half_width);
  const side_padding = Math.min(padding, half_width - side_border_width);
  return {
    width: `${width}px`,
    height: `${height}px`,
    'padding-left': `${side_padding}px`,
    'padding-right': `${side_padding}px`,
    'padding-bottom': `${padding}px`,
    'padding-top': `${padding}px`,
    'border-left-width': side_border_width === 0 && width === 1 ? '1px' : `${side_border_width}px`,
    'border-right-width': `${side_border_width}px`,
    'border-top-width': `${border}px`,
    'border-bottom-width': `${border}px`,
  };
};

/////////////
// Display //
/////////////

export const printDuration = (duration, precision) => {
  if (duration === 0) {
    return '0 s';
  } else if (duration >= 1) {
    return `${duration.toPrecision(precision)} s`;
  } else if (duration >= 1e-3) {
    return `${(1e3 * duration).toPrecision(precision)} ms`;
  } else if (duration >= 1e-6) {
    return `${(1e6 * duration).toPrecision(precision)} µs`;
  } else {
    return `${(1e9 * duration).toPrecision(precision)} ns`;
  }
};

// This was the original implementation of budgeting. It was inlined into the flamegraph components
// to improve performance by letting vue not recomputing needless stuff on property change.

// export const budgetDuration = (duration, total, budget) =>
//   Math.min(budget, Math.floor(budget * (duration / total)));

// export const budgetEvent = (event, total, budget) =>
//   budgetDuration(getEventDuration(event), total, budget);

// export const budgetEventArray = (events, total, budget) =>
//   budgetDuration(events.map(getEventDuration).reduce(add, 0), total, budget);

// export const budgetEventChildren = (event, budget) => {
//   const duration = getEventDuration(event);
//   if (duration === 0) {
//     return budget;
//   } else {
//     return budgetEventArray(event.children, duration, budget);
//   }
// };

// export const compileBudgetEvent = (focus, events, budget) => {
//   if (focus) {
//     const ancestors = new Set(focus.ancestors());
//     ancestors.add(focus);
//     return (event) => (ancestors.has(event) ? budget : 0);
//   } else {
//     const total = events.map(getEventDuration).reduce(add, 0);
//     if (total === 0) {
//       const default_budget = Math.floor(budget / events.length);
//       return (_event) => default_budget;
//     } else {
//       const valid_event_count = events.filter(isEventDurationValid).length;
//       const invalid_event_count = events.length - valid_event_count;
//       const valid_budget = Math.floor((budget * valid_event_count) / events.length);
//       const invalid_budget = Math.floor((budget * invalid_event_count) / events.length);
//       const default_invalid_budget = Math.floor(
//         (invalid_budget * invalid_event_count) / events.length
//       );
//       return (event) =>
//         isEventDurationValid(event)
//           ? budgetEvent(event, total, valid_budget)
//           : default_invalid_budget;
//     }
//   }
// };
