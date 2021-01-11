<template>
  <div class="details-panel">
    <h3 class="details-panel__title">{{title}}</h3>
    <a href="#" v-if="canGoBack" @click.prevent="goBack">Back</a>
    <div class="details-panel__details">
      <component :is="detailsType" :object-descriptor="objectDescriptor"/>
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
import { POP_OBJECT_STACK } from '@/store/vsCode';

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
    selectedObject: {
      type: Object,
    },
  },

  computed: {
    detailsType() {
      let kind = 'null';
      if (this.selectedObject && this.selectedObject.kind) {
        kind = this.selectedObject.kind;
      }

      return `v-details-panel-${kind}`;
    },

    objectDescriptor() {
      return this.selectedObject ? this.selectedObject.object : null;
    },

    canGoBack() {
      return this.$store.getters.canPopStack;
    },
  },

  methods: {
    goBack() {
      this.$store.commit(POP_OBJECT_STACK);
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
  padding: 0 2rem;

  &__title {
    font-size: 1.2rem;
    color: #e3e5e8;
    text-transform: uppercase;
    margin-bottom: 1rem;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #343742;
  }
}
</style>
