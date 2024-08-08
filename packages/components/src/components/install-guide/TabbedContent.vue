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
      justUpdated: false,
      tabNames: Object.keys(this.$slots),
    };
  },
  methods: {
    onSelectTab(tabIndex: number) {
      this.selectedTab = tabIndex;
      this.$emit('select-tab', this.tabNames[tabIndex], tabIndex);
    },
  },
  async updated() {
    if (this.justUpdated) return;

    this.$set(this, 'tabNames', Object.keys(this.$slots));
    this.justUpdated = true;

    await this.$nextTick();
    this.justUpdated = false;
  },
});
</script>

<style scoped lang="scss">
$bg-primary: rgba(#e3e5e8, 0.9);
$bg-secondary: rgba(white, 0.25);
$fg-primary: rgba(black, 0.75);
$fg-secondary: rgba(white, 0.75);

.tabbed-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;

  &__tabs {
    display: flex;
    flex-direction: row;
    border-bottom: 3px solid $bg-primary;
    border-radius: 2px;
  }

  &__tab {
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-weight: bold;
    user-select: none;
    color: $gray4;
    border-radius: $border-radius $border-radius 0 0;
    border: 1px solid $bg-secondary;
    border-bottom: none;
    transition: $transition;

    &:not(:first-child) {
      border-left: none;
    }

    &:hover {
      color: $gray5;
      background-color: $bg-secondary;
    }

    &--selected {
      color: $fg-primary;
      background-color: $bg-primary;
    }
  }

  &__content {
    flex: 1;
    overflow: visible;
    padding: 0.25rem 1rem;
  }
}
</style>
