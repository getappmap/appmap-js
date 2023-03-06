<template>
  <div class="tabs">
    <div class="tabs__header">
      <div class="tabs__group">
        <v-tab-button
          v-for="tab in tabs"
          :key="tab.name"
          :label="tab.name"
          :is-active="activeTab === tab"
          :tabName="tab.tabName"
          :isNew="tab.isNew"
          @click.native="activateTab(tab)"
        >
        </v-tab-button>
      </div>
      <!-- <div class="tabs__notification">
        <slot name="notification" />
      </div> -->
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

      let tab;
      if (this.initialTab) tab = this.tabs.find((t) => t.tabName === this.initialTab);
      else tab = this.tabs[0];

      if (tab) this.activateTab(tab);
    });
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
    align-items: baseline;
  }

  &__content {
    width: 100%;
    height: 100%;
    padding-top: 40px;
  }
}

@media (max-width: 900px) {
  .tabs {
    &__header {
      flex-direction: column-reverse;
      min-height: 70px;
      padding-top: 0.5rem;
      height: auto;
      gap: 0.4rem;
      justify-content: center;
      justify-items: center;
    }
    &__group {
      width: 100%;
      justify-content: center;
    }
    &__notification {
      align-self: center;
    }
    &__content {
      padding-top: 70px;
    }
  }
}
</style>
