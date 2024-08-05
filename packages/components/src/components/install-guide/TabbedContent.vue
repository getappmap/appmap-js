<template>
  <div class="tabbed-content">
    <div class="tabbed-content__tabs">
      <div
        v-for="(tabName, index) in tabNames"
        :key="tabName"
        @click="onSelectTab(index)"
        :class="{
          'tabbed-content__tab': 1,
          'tabbed-content__tab--selected': selectedTab === index,
        }"
      >
        {{ tabName }}
      </div>
    </div>
    <div class="tabbed-content__content">
      <slot :name="tabNames[selectedTab]" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      selectedTab: 0,
    };
  },
  computed: {
    tabNames() {
      return Object.keys(this.$slots);
    },
  },
  methods: {
    onSelectTab(tabIndex: number) {
      this.selectedTab = tabIndex;
    },
  },
  updated() {
    (this as any)._computedWatchers.tabNames.run(); // eslint-disable-line no-underscore-dangle
  },
});
</script>

<style scoped lang="scss">
$bg-primary: rgba(white, 0.5);
$bg-secondary: rgba(white, 0.25);
$fg-primary: rgba(black, 0.75);
$fg-secondary: rgba(white, 0.75);

.tabbed-content {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__tabs {
    display: flex;
    flex-direction: row;
    border-bottom: 3px solid rgba(white, 0.1);
  }

  &__tab {
    padding: 0.5rem 1rem;
    cursor: pointer;
    color: $gray4;
    border-radius: $border-radius $border-radius 0 0;

    &:hover {
      color: $gray5;
      background-color: $bg-secondary;
    }

    &--selected {
      color: $fg-primary;
      font-weight: bold;
      background-color: $bg-primary;
    }
  }

  &__content {
    flex: 1;
    overflow: auto;
  }
}
</style>
