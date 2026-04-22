<template>
  <div class="tabs">
    <div class="tabs__header" data-cy="tabs">
      <div class="tabs__group">
        <v-tab-button
          v-for="tab in tabs"
          :key="tab.name"
          :label="tab.name"
          :is-active="activeTabName === tab.name"
          :tabName="tab.tabName"
          @click="activateByName(tab.name)"
        >
        </v-tab-button>
      </div>
      <div class="tabs__controls">
        <slot name="controls" />
      </div>
    </div>
    <div class="tabs__content">
      <div class="tabs__notification">
        <slot name="notification" />
      </div>
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
    initialTab: {
      type: String,
    },
  },

  provide() {
    return { tabsContext: this };
  },

  data() {
    return {
      activeTabName: null,
      tabs: [], // array of { name, tabName }
    };
  },

  methods: {
    registerTab(tabInfo) {
      this.tabs.push(tabInfo);
      if (!this.activeTabName) {
        const initial = this.initialTab
          ? this.tabs.find((t) => t.tabName === this.initialTab)
          : this.tabs[0];
        if (initial) this.activateByName(initial.name);
      }
    },

    unregisterTab(name) {
      const idx = this.tabs.findIndex((t) => t.name === name);
      if (idx !== -1) this.tabs.splice(idx, 1);
    },

    activateByName(name) {
      const tab = this.tabs.find((t) => t.name === name);
      if (!tab || tab.name === this.activeTabName) return;
      this.activeTabName = name;
      this.$emit('activateTab', tab);
    },
  },
};
</script>

<style scoped lang="scss">
.tabs {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  background-color: $black;
  // Using overflow: hidden here was causing issues in our Cypress tests
  // using overflow: clip instead
  // see https://github.com/cypress-io/cypress/issues/23898
  overflow: clip;

  &__header {
    width: 100%;
    border-bottom: 1px solid $gray2;
    height: max-content;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    padding-top: 0.4rem;
    z-index: 100;
    position: absolute;

    @media (max-width: 900px) {
      overflow: auto;
    }
  }

  &__group {
    align-self: flex-end;
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;
  }

  &__notification {
    margin: 0;
    border-radius: 0;
  }

  &__controls {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  &__content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding-top: 40px;
  }
}

.narrow {
  .tabs__header {
    flex-direction: column-reverse;
    min-height: 70px;
    padding-top: 0.5rem;
    height: auto;
    gap: 0.4rem;
    justify-content: end;
  }
  .tabs__group {
    align-self: center;
    justify-content: center;
  }
  .tabs__notification {
    align-self: center;
  }
  .tabs__content {
    padding-top: 70px;
  }
  .tabs__controls {
    gap: 1rem;
    top: 0.5rem;
    margin-bottom: 0.3rem;
  }
}
</style>
