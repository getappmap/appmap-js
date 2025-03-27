import Vue from 'vue';

export default Vue.extend({
  props: {
    handle: {
      type: String,
      required: false,
    },
    isReference: {
      type: Boolean,
      default: false,
    },
  },
});
