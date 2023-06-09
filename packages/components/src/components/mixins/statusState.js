// This mixin is intended to be used by components containing a status bar
import { StepStatus } from '@/components/install-guide/Status.vue';

export default {
  props: {
    statusStates: {
      type: Array,
      default: () => Array.from({ length: 5 }, () => 0),
      validator: (value) => value.every((v) => v >= 0 && v <= StepStatus.NumStatuses),
    },
  },
};
