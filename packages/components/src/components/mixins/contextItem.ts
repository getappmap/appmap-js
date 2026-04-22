import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    uri: {
      type: String,
      required: false,
    },
    isReference: {
      type: Boolean,
      default: false,
    },
  },
});
