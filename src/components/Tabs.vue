<template>
  <div class="tabs">
    <div class="tabs__header">
      <v-tab-button
        v-for="tab in tabs"
        :key="tab.key"
        :label="tab.name"
        :is-active="tab.isActive"
        @click.native="activateTab(tab.key)"
      />
    </div>
    <div class="tabs__content">
      <slot />
    </div>
  </div>
</template>

<script>
import VTabButton from '@/components/TabButton.vue';

export default {
  name: 'v-tabs',

  components: { VTabButton },

  props: {
    tabs: {
      type: Array,
      required: true,
    },
  },

  methods: {
    activateTab(tabKey) {
      this.$emit('activateTab', tabKey);
    },
  },
};
</script>

<style scoped lang="scss">
.tabs {
  width: 100%;
  height: 100%;

  &__header {
    border: 0;
  }

  &__content {
    width: 100%;
    height: 100%;
  }
}
</style>
