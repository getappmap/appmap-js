<template>
  <div class="details-label">
    <div class="details-label__header">
      <span class="details-label__header-type"><CircleLegend class="legend" />Label</span>
      <h2 class="details-label__header-title">{{ label }}</h2>
    </div>
    <v-details-panel-list title="Routes" :items="labelInfo.route" />
    <v-details-panel-list title="Packages" :items="labelInfo.package" />
    <v-details-panel-list title="Classes" :items="labelInfo.class" />
    <v-details-panel-list title="Functions" :items="labelInfo.function" />
    <v-details-panel-list title="Database" :items="labelInfo.database" />
    <v-details-panel-list title="Events" :items="labelInfo.event" :event-quickview="true" />
  </div>
</template>

<script>
import { AppMap } from '@appland/models';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';
import CircleLegend from '@/assets/circle-legend.svg';

export default {
  name: 'v-details-label',
  components: {
    VDetailsPanelList,
    CircleLegend,
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
    display: flex;
    flex-direction: column;

    &-type {
      margin: 0 0 0.4rem;
      text-transform: uppercase;
      font-weight: 700;
      color: $base11;
      flex-direction: row;
      display: flex;
      gap: 0.5rem;
      align-items: center;
      padding: 0.25rem;
      color: $white;
      .legend circle {
        fill: $base11;
      }
    }

    &-title {
      color: $gray6;
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 0.8rem;
    }
  }
}
</style>
