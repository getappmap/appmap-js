<template>
  <div>
    <h1>Stats</h1>
    <ul>
      <li v-for="func in stats" :key="func['function']">
        <p>function: {{ func['function'] }}</p>
        <p>count: {{ func.count }}</p>
        <p>size on disk: {{ displaySize(func.size) }}</p>
        <p>location: {{ func.location }}</p>
      </li>
    </ul>
  </div>
</template>

<script>
const KILOBYTE = 1000;
const MEGABYTE = KILOBYTE * 1000;
const GIGABYTE = MEGABYTE * 1000;

export default {
  name: 'v-stats-panel',
  props: {
    stats: {
      type: Object,
      default: () => ({}),
    },
  },
  methods: {
    displaySize(sizeInBytes) {
      let divisor;
      let suffix;

      if (sizeInBytes > GIGABYTE) {
        divisor = GIGABYTE;
        suffix = 'GB';
      } else if (sizeInBytes > MEGABYTE) {
        divisor = MEGABYTE;
        suffix = 'MB';
      } else if (sizeInBytes > KILOBYTE) {
        divisor = KILOBYTE;
        suffix = 'KB';
      } else {
        divisor = 1;
        suffix = 'bytes';
      }

      return `${(sizeInBytes / divisor).toFixed(1)} ${suffix}`;
    },
  },
};
</script>

<style scoped lang="scss"></style>
