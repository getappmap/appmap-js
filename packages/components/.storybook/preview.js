import { configureCompat } from 'vue';

// Configure Vue compatibility mode
configureCompat({
  MODE: 2, // Use Vue 2 behavior for most things
  COMPONENT_ASYNC: true,
  COMPONENT_FUNCTIONAL: true,
  COMPONENT_V_MODEL: true,
  CONFIG_OPTION_MERGE_STRATS: true,
  CONFIG_GLOBAL_PROPERTIES: true,
  CONFIG_IGNORED_ELEMENTS: true,
  CUSTOM_DIR: true,
  GLOBAL_EXTEND: true,
  GLOBAL_MOUNT: true,
  GLOBAL_PROTOTYPE: true,
  INSTANCE_ATTRS_CLASS_STYLE: true,
  INSTANCE_CHILDREN: true,
  INSTANCE_DELETE: true,
  INSTANCE_DESTROY: true,
  INSTANCE_EVENT_EMITTER: true,
  INSTANCE_EVENT_HOOKS: true,
  INSTANCE_LISTENERS: true,
  INSTANCE_SCOPED_SLOTS: true,
  INSTANCE_SET: true,
  OPTIONS_BEFORE_DESTROY: true,
  OPTIONS_DATA_MERGE: true,
  OPTIONS_DESTROYED: true,
  RENDER_FUNCTION: true,
  TRANSITION_GROUP_ROOT: true,
  WATCH_ARRAY: true,
  FILTERS: true, // Assuming filters might be used
});

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  docs: {
    source: {
      type: 'code',
    },
  },
};
