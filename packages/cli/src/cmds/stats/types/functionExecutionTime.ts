export type FunctionExecutionTime = {
  name: string;
  elapsedInstrumentationTimeTotal: number;
  numberOfCalls: number;
  path: string;
};

// intentionally use snakecase in JSON output
export type SlowestExecutionTime = {
  elapsed_instrumentation_time_total: number;
  num_calls: number;
  name: string;
  path: string;
};
