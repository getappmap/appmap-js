<template>
  <div class="flamegraph-root" @click="clearSelectEvent" :style="style">
    {{ sanitizedTitle }}
  </div>
</template>

<script>
export default {
  name: 'v-flamegraph-root',
  emits: ['clearSelectEvent'],
  props: {
    budget: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      default: 'root',
    },
  },
  methods: {
    clearSelectEvent() {
      this.$emit('clearSelectEvent');
    },
  },
  computed: {
    sanitizedTitle() {
      return typeof this.title === 'string' ? this.title : 'root';
    },
    style() {
      return { width: `${this.budget}px` };
    },
  },
};
</script>

<style scoped lang="scss">
.flamegraph-root {
  font-family: 'IBM Plex Mono', monospace;
  border: 1px solid #681f7c;
  box-sizing: border-box;
  padding: 10px;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #9c2fba;
  color: #eaeaea;
  cursor: pointer;
  transition: all 1s linear;
  &:hover {
    color: #ffffff;
  }
}
</style>
