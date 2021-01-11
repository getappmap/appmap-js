<template>
  <div class="details-panel">
    <h3 class="details-panel__title">{{title}}</h3>
    <div class="details-panel__content">
      <h4 class="details-panel__subtitle">{{objectName}}</h4>

      <div class="details-panel__details">
        <component :is="detailsType" :object-descriptor="$store.state.selectedObject.object"/>
      </div>
    </div>
  </div>
</template>

<script>
import VDetailsPanelClass from '@/components/DetailsPanelClass.vue';
import VDetailsPanelDatabase from '@/components/DetailsPanelDatabase.vue';
import VDetailsPanelEdge from '@/components/DetailsPanelEdge.vue';
import VDetailsPanelEvent from '@/components/DetailsPanelEvent.vue';
import VDetailsPanelHttp from '@/components/DetailsPanelHttp.vue';
import VDetailsPanelNull from '@/components/DetailsPanelNull.vue';
import VDetailsPanelPackage from '@/components/DetailsPanelPackage.vue';
import VDetailsPanelRoute from '@/components/DetailsPanelRoute.vue';

export default {
  name: 'v-details-panel',
  components: {
    VDetailsPanelClass,
    VDetailsPanelDatabase,
    VDetailsPanelEdge,
    VDetailsPanelEvent,
    VDetailsPanelHttp,
    VDetailsPanelNull,
    VDetailsPanelPackage,
    VDetailsPanelRoute,
  },
  props: {
    title: {
      type: String,
      default: 'Component details',
    },
    subtitle: String,
  },

  computed: {
    objectName() {
      if (!this.selectedObject.value) {
        return '';
      }

      const { name, type } = this.selectedObject.value;
      return `${type} ${name}`;
    },

    detailsType() {
      const kind = this.selectedObject.kind || 'null';
      return `v-details-panel-${kind}`;
    },

    selectedObject() {
      return this.$store.state.selectedObject;
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel {
  display: inline-block;
  min-width: 280px;
  width: 100%;
  height: 100%;
  color: $gray6;
  background-color: $gray2;
  word-break: break-word;

  &__title {
    font-size: 1.2rem;
    color: #e3e5e8;
    text-transform: uppercase;
    margin-bottom: 1rem;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #343742;
  }

  &__subtitle {
    margin-bottom: 1rem;
    color: #e3e5e8;
  }

  &__content {
    padding: 0 2rem;
  }

  &__details {

  }
}
</style>
