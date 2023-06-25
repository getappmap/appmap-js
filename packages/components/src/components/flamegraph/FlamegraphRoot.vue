<template>
  <div class="flamegraph-root" @click="onClick" :style="style">
    {{ sanitizedTitle }}
  </div>
</template>

<script>
export default {
  name: 'v-flamegraph-root',
  emits: ['select'],
  props: {
    selection: {
      type: Boolean,
      required: true,
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
    sanitizedTitle() {
      return typeof this.title === 'string' ? this.title : 'root';
    },
    style() {
      return {
        opacity: this.selection ? '0.5' : '1',
      };
    },
  },
};
</script>

<style scoped lang="scss">
$background-color: #6fddd6;
$text-color: #010306;
.flamegraph-root {
  position: sticky;
  left: 0px;
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
  &:hover {
    color: lighten($text-color, 20%);
  }
}
</style>
