<template>
  <div class="details-panel">
    <v-section :title="title">
      <div class="row" v-if="canBeCleared">
        <a class="link" href="#" @click.prevent="clearSelection">Clear selection</a>
      </div>
      <div class="row" v-if="canGoBack">
        <a class="link" href="#" @click.prevent="goBack">Back</a>
      </div>
      <div class="details-panel__details">
        <component :is="detailsType" :object-descriptor="objectDescriptor"/>
      </div>
    </v-section>
  </div>
</template>

<script>
import VDetailsPanelClass from '@/components/DetailsPanelClass.vue';
import VDetailsPanelDatabase from '@/components/DetailsPanelDatabase.vue';
import VDetailsPanelEdge from '@/components/DetailsPanelEdge.vue';
import VDetailsPanelEvent from '@/components/DetailsPanelEvent.vue';
import VDetailsPanelFunction from '@/components/DetailsPanelFunction.vue';
import VDetailsPanelHttp from '@/components/DetailsPanelHttp.vue';
import VDetailsPanelNull from '@/components/DetailsPanelNull.vue';
import VDetailsPanelPackage from '@/components/DetailsPanelPackage.vue';
import VDetailsPanelRoute from '@/components/DetailsPanelRoute.vue';
import VSection from '@/components/Section.vue';
import { POP_OBJECT_STACK } from '@/store/vsCode';

export default {
  name: 'v-details-panel',
  components: {
    VDetailsPanelClass,
    VDetailsPanelDatabase,
    VDetailsPanelEdge,
    VDetailsPanelEvent,
    VDetailsPanelFunction,
    VDetailsPanelHttp,
    VDetailsPanelNull,
    VDetailsPanelPackage,
    VDetailsPanelRoute,
    VSection,
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
    objectName() {
      if (!this.selectedObject || !this.selectedObject.object) {
        return '';
      }

      const { name, type } = this.selectedObject.object;
      return `${type} ${name}`;
    },

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

    canBeCleared() {
      return this.selectedObject && this.selectedObject.object;
    },

    canGoBack() {
      return this.$store.getters.canPopStack;
    },
  },

  methods: {
    clearSelection() {
      this.$root.$emit('component_diagram_clear');
    },
    goBack() {
      this.$store.commit(POP_OBJECT_STACK);
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel {
  min-width: 280px;
  width: 100%;
  height: 100%;
  color: $gray6;
  background-color: $gray2;
  word-break: break-word;
  padding: 0 2rem;

  &__title {
    padding: 0.4rem 1rem;
    font-size: 0.8rem;
    color: $gray6;
    background-color: $black;
    text-align: center;
  }
}

.row {
  display: block;
  width: 100%;
  padding: .5rem;
}

.link {
  color: $blue;
  text-decoration: none;
}
</style>
