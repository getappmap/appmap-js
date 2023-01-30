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
  },

  data() {
    return {
      isActive: false,
      classes: this.allowScroll ? 'tab-content-scroll' : '',
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

.tab-content.tab-content-scroll {
  overflow: auto;
  padding-bottom: 2rem;
}
</style>
