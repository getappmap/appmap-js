export default {
  data() {
    return {
      $resizeObserver: new ResizeObserver(() => this.onResize()),
    };
  },

  methods: {
    $onResize() {
      if (this.onResize) {
        this.onResize();
      }
    },
  },

  mounted() {
    this._data.$resizeObserver.observe(this.$el); // eslint-disable-line no-underscore-dangle
  },
};
