<template>
  <div v-if="isActive" class="tab-content">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'v-tab',

  props: {
    name: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      isActive: false,
    };
  },

  methods: {
    setActive(value) {
      this.isActive = value;
    },
  },
};
</script>

<style scoped lang="scss">
  .tab-content {
    height: inherit;
  }
</style>
