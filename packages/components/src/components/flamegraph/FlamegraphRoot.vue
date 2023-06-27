<template>
  <div :class="classes" @click="onClick">
    {{ sanitizedTitle }}
  </div>
</template>

<script>
export default {
  name: 'v-flamegraph-root',
  emits: ['select'],
  props: {
    pruned: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: 'root',
    },
  },
  methods: {
    onClick() {
      this.$emit('select', null);
    },
  },
  computed: {
    classes() {
      return { 'flamegraph-root': true, 'flamegraph-root-pruned': this.pruned };
    },
    sanitizedTitle() {
      return typeof this.title === 'string' ? this.title : 'root';
    },
  },
};
</script>

<style scoped lang="scss">
$background-color: #6fddd6;
$text-color: #010306;
.flamegraph-root {
  user-select: none;
  position: sticky;
  left: 0px;
  font-family: 'IBM Plex Mono', monospace;
  border: 1px solid darken($background-color, 10%);
  box-sizing: border-box;
  padding: 10px;
  font-size: 12px;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: $background-color;
  color: $text-color;
}

.flamegraph-root-pruned {
  opacity: 0.5;
  cursor: pointer;
  &:hover {
    color: lighten($text-color, 40%);
  }
}
</style>
