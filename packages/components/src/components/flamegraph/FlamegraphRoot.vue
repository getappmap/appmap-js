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
$background-color: #6fddd6;
$text-color: #010306;
.flamegraph-root {
  font-family: 'IBM Plex Mono', monospace;
  border: 1px solid darken($background-color, 10%);
  box-sizing: border-box;
  padding: 10px;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: $background-color;
  color: $text-color;
  cursor: pointer;
  transition: all 1s linear;
  &:hover {
    color: lighten($text-color, 20%);
  }
}
</style>
