import Vue from 'vue';

export default Vue.extend({
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
