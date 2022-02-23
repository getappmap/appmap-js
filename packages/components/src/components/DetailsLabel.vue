<template>
  <div class="details-label">
    <div class="details-label__header">
      <h4 class="details-label__header-title">{{ label }}</h4>
      <span class="details-label__header-type">Label</span>
    </div>
    <v-details-panel-list title="Routes" :items="labelInfo.route" />
    <v-details-panel-list title="Packages" :items="labelInfo.package" />
    <v-details-panel-list title="Classes" :items="labelInfo.class" />
    <v-details-panel-list title="Functions" :items="labelInfo.function" />
    <v-details-panel-list title="Database" :items="labelInfo.database" />
    <v-details-panel-list
      title="Events"
      :items="labelInfo.event"
      :event-quickview="true"
    />
  </div>
</template>

<script>
import { AppMap } from '@appland/models';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-label',
  components: {
    VDetailsPanelList,
  },
  props: {
    label: {
      type: String,
      required: true,
    },
    appMap: AppMap,
  },
  computed: {
    labelInfo() {
      return this.appMap.labels[this.label] || {};
    },
  },
};
</script>

<style scoped lang="scss">
.details-label {
  margin-bottom: 1rem;

  &__header {
    margin: 0 0 1rem;

    &-title {
      margin: 0 0 0.2rem;
      font-size: 1rem;
      font-weight: 700;
      color: $gray6;
    }

    &-type {
      margin: 0;
      color: $gray4;
      text-transform: uppercase;
      font-size: 0.75rem;
      line-height: 1;
    }
  }
}
</style>
