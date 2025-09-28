const telemetryConstants = {
  events: {
    // Indicates a Navie response has been completed successfully
    NavieResponse: 'navie:response',

    // Indicates an error occurred during the processing of a Navie request
    DebugException: 'navie:exception',
  },
  metrics: {
    // The time taken, in ms, to generate vector terms
    NavieVectorTermsMs: 'appmap.navie.vector_terms_ms',

    // The number of context lookups performed, including those performed by gather
    NavieContextLookupCount: 'appmap.navie.context_lookup_count',

    // The total number of context results returned
    NavieContextLookupResults: 'appmap.navie.context_lookup_results',

    // The total time taken, in ms, to perform the final context lookup
    NavieContextLookupMs: 'appmap.navie.context_lookup_ms',

    // The number of classification labels generated
    NavieClassificationCount: 'appmap.navie.classification_count',

    // The time taken, in ms, to generate classification labels
    NavieClassificationMs: 'appmap.navie.classification_ms',

    // The time taken, in ms, to start the final completion process
    NavieCompletionStartMs: 'appmap.navie.completion_start_ms',

    // The time taken, in ms, to complete the final completion (and ultimately, the response)
    NavieCompletionEndMs: 'appmap.navie.completion_end_ms',

    // The length of the final response, in characters
    NavieCompletionLength: 'appmap.navie.completion_length',

    // The length of the user's question, in characters
    NavieQuestionLength: 'appmap.navie.question_length',

    // The length of the user's code selection, in characters
    NavieCodeSelectionLength: 'appmap.navie.code_selection_length',
  },
  properties: {
    // Indicates a specific type or location of error
    DebugErrorCode: 'appmap.debug.error_code',

    // An error message as presented to the user
    DebugUserError: 'appmap.debug.user_error',

    // A string representation of an error, such as a stack trace
    DebugException: 'appmap.debug.exception',

    // The name of the Navie model used for the response
    NavieModelId: 'appmap.navie.model.id',

    // The base URL for the Navie model used for the response
    NavieModelBaseUrl: 'appmap.navie.model.base_url',

    // The provider of the Navie model used for the response (e.g., OpenAI, Anthropic)
    NavieModelProvider: 'appmap.navie.model.provider',

    // The name of the Navie agent used for the response
    NavieAgent: 'appmap.navie.agent',

    // The classification generated for a given inquiry, to be mapped to weight
    NavieClassification: (label: string) => `appmap.navie.classification.${label}`,

    // The conversation or thread ID for the Navie interaction
    NavieThreadId: 'appmap.navie.thread_id',

    // The AI key environment variable name used for the response
    NavieAIKeyName: 'appmap.navie.ai_key_name',

    // The code editor in use, if known
    CommonCodeEditor: 'common.code_editor',
  },
} as const;

export default telemetryConstants;
export const events = telemetryConstants.events;
export const metrics = telemetryConstants.metrics;
export const properties = telemetryConstants.properties;
