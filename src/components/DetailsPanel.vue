<template>
  <div class="details-panel">
    <h3 class="details-panel__title">
      <img src="../assets/appland-logo.svg" />
    </h3>
    <div class="details-panel__content">
      <div class="details-panel__details">
        <a href="#" v-if="canGoBack" @click.prevent="goBack">Back</a>
        <component :is="detailsType" :object-descriptor="objectDescriptor"/>
      </div>
    </div>
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
  },
  props: {
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
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  min-width: 280px;
  width: 100%;
  height: 100%;
  color: $gray6;
  background-color: $gray2;
  word-break: break-word;
  border-right: 1px solid $gray3;

  .details-panel__title {
    padding: 2rem;
    margin: 0;
    img {
      max-width: 10rem;
    }
  }

  // &__title {
  //   font-size: .9rem;
  //   font-weight: 400;
  //   color: $white;
  //   text-transform: uppercase;
  //   margin: 0;
  //   padding: .5rem 2rem;
  //   border-bottom: 1px solid darken($gray2,10);
  //   letter-spacing: .75px;
  //   background-color: darken($gray2,05);
  // }

  &__subtitle {
    margin-bottom: 1rem;
    color: $white;
  }

  &__content {
    padding: 0;
  }

  &__details {

  }
}
</style>
