<template>
  <div class="tabs">
    <div class="tabs__header">
      <v-tab-button
        v-for="tab in tabs"
        :key="tab.name"
        :label="tab.name"
        :is-active="activeTab === tab"
        :reference="tab.reference"
        @click.native="activateTab(tab)"
      >
      </v-tab-button>
      <div class="tabs__notification">
        <slot name="notification" />
      </div>
      <div class="tabs__controls">
        <slot name="controls" />
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
    position: relative;
    border-bottom: 1px solid $gray2;
    height: 44px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    z-index: 100;
  }

  &__notification {
    align-self: flex-end;
    margin: 0 1rem 0.25rem 1rem;
    flex: 1;
  }

  &__controls {
    position: relative;
    z-index: 1;

    & > *:not(:last-child) {
      margin-right: 0.5rem;
    }
  }

  &__content {
    width: 100%;
    height: 100%;
  }
}
</style>
