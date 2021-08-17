<template>
  <div class="details-label">
    <div class="details-label__header">
      <span class="details-label__header-type">Label</span>
      <h2 class="details-label__header-title">{{ label }}</h2>
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
    margin: 0 2rem 1rem;
    display: flex;
    flex-direction: column;

    &-type {
      text-transform: uppercase;
      font-size: 0.9rem;
      font-weight: 500;
      color: $gray4;
      letter-spacing: 0.5px;
    }

    &-title {
      margin: 0.5rem 0 0.8rem;
      font-size: 1.5rem;
      font-weight: 500;
      color: $base03;
      letter-spacing: 0.5px;
    }
  }
}
</style>
