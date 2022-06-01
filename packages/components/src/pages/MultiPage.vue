<script>
function vNodeId(vnode) {
  return vnode && vnode.data && vnode.data.attrs && vnode.data.attrs.id
    ? vnode.data.attrs.id
    : '';
}

export default {
  name: 'multi-page',

  props: {
    page: {
      type: Number,
      default: 0,
    },
    disabledPages: {
      type: Set,
      default: () => new Set(),
    },
  },

  data() {
    const firstSlot = this.$slots.default.filter((vnode) => vnode.tag)[0];
    const currentPage = vNodeId(firstSlot);
    return {
      currentPage,
    };
  },

  render(h) {
    return h(
      'div',
      this.slots().map((vnode) => {
        const nodeId = vNodeId(vnode);
        return h(
          'div',
          {
            style: {
              display: nodeId === this.currentPage ? '' : 'none',
            },
          },
          [vnode]
        );
      })
    );
  },

  methods: {
    slots() {
      return this.$slots.default.filter(
        (vnode) => vnode.tag && !this.disabledPages.has(vNodeId(vnode))
      );
    },

    getPageId(dir) {
      const slots = this.slots();
      const pageIndex = slots.findIndex((v) => vNodeId(v) === this.currentPage);
      const numSlots = slots.length;
      const nextIndex = Math.max(0, Math.min(pageIndex + dir, numSlots));
      return vNodeId(slots[nextIndex]);
    },

    next() {
      const nextId = this.getPageId(1);
      this.jumpTo(nextId);
    },

    previous() {
      const prevId = this.getPageId(-1);
      this.jumpTo(prevId);
    },

    jumpTo(pageId) {
      this.currentPage = pageId;
    },
  },

  mounted() {
    this.$root.$on('page-next', this.next);
    this.$root.$on('page-previous', this.previous);
    this.$root.$on('page-jump-to', this.jumpTo);

    const slots = this.slots();
    slots.forEach(({ componentInstance: vm }, i) => {
      vm.$set(vm, 'first', i === 0);
      vm.$set(vm, 'last', i === slots.length - 1);
    });
  },
};
</script>
