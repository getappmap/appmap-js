<template>
  <keep-alive>
    <v-tab-content v-if="isActive" :class="classes">
      <slot />
    </v-tab-content>
  </keep-alive>
</template>

<script>
import VTabContent from './TabContent.vue';

export default {
  name: 'v-tab',

  components: {
    VTabContent,
  },

  inject: ['tabsContext'],

  props: {
    name: {
      type: String,
      required: true,
    },
    reference: String,
    allowScroll: {
      type: Boolean,
      default: false,
    },
    tabName: String,
  },

  computed: {
    isActive() {
      return this.tabsContext.activeTabName === this.name;
    },
    classes() {
      return this.allowScroll ? 'tab-content-scroll' : '';
    },
  },

  mounted() {
    this.tabsContext.registerTab({ name: this.name, tabName: this.tabName });
  },

  beforeDestroy() {
    this.tabsContext.unregisterTab(this.name);
  },
};
</script>

<style scoped lang="scss">
.tab-content {
  height: inherit;
}

.tab-content.tab-content-scroll {
  overflow: auto;
}
</style>
