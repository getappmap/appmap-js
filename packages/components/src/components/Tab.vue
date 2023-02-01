<template>
  <keep-alive>
    <v-tab-content v-if="isActive">
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
