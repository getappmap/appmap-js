<template>
  <div class="tabs">
    <div class="tabs__header">
      <v-tab-button
        v-for="tab in tabs"
        :key="tab.name"
        :label="tab.name"
        :is-active="activeTab === tab"
        @click.native="activateTab(tab)"
      >
      </v-tab-button>
      <div class="tabs__notification">
        <slot name="notification" />
      </div>
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

  data() {
    return {
      activeTab: null,
      tabs: [],
    };
  },

  methods: {
    activateTab(tab) {
      if (tab === this.activeTab) {
        return;
      }

      if (this.activeTab) {
        this.activeTab.setActive(false);
      }

      if (tab) {
        tab.setActive(true);
      }

      this.activeTab = tab;
      this.$emit('activateTab', tab);
    },
  },

  mounted() {
    this.$nextTick(() => {
      this.tabs = this.$children.filter((c) => c.$options.name === 'v-tab');
      this.activateTab(this.tabs[0]);
    });
  },
};
</script>

<style scoped lang="scss">
.tabs {
  width: 100%;
  height: 100%;

  &__header {
    display: flex;
    padding: 1.5rem;
  }

  &__notification {
    flex: 1;
    margin: 0 8rem 0 1.5rem;
  }

  &__content {
    width: 100%;
    height: 100%;
  }
}
</style>
