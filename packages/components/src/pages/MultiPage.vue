<template>
  <div><slot /></div>
</template>

<script>
export default {
  name: 'multi-page',

  props: {
    page: {
      type: Number,
      default: 0,
    },
  },

  data() {
    return {
      currentPage: 0,
    };
  },

  watch: {
    currentPage: {
      handler() {
        this.updatePage();
      },
      immediate: true,
    },
  },

  methods: {
    next() {
      this.jumpTo(this.currentPage + 1);
    },

    previous() {
      this.jumpTo(this.currentPage - 1);
    },

    jumpTo(pageIndex) {
      const numPages = this.$children.length;
      this.currentPage = Math.max(Math.min(pageIndex, numPages - 1), 0);
    },

    updatePage() {
      this.$nextTick(() => {
        const currentComponent = this.$children[this.currentPage];
        this.$children.forEach((component) => {
          if (component.$el) {
            component.$el.style.display =
              component === currentComponent ? '' : 'none';
          }
        });
      });
    },
  },

  mounted() {
    this.$root.$on('page-next', this.next);
    this.$root.$on('page-previous', this.previous);
    this.$root.$on('page-jump-to', this.jumpTo);
    this.updatePage();
  },
};
</script>
