<template>
  <div class="details-panel">
    <v-section :title="title">
      <div class="block" v-if="canBeCleared">
        <a class="link" href="#" @click.prevent="clearSelection">
          <v-icon name="clear"></v-icon> Clear selection</a>
      </div>
      <div class="block" v-if="canGoBack">
        <a class="link" href="#" @click.prevent="goBack">
          <v-icon name="arrow-left"></v-icon> Back to <b>{{prevSelectedObject.object.name}}</b>
        </a>
      </div>
      <div class="block">
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
import VIcon from '@/components/Icon.vue';
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
    VIcon,
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

    prevSelectedObject() {
      return this.$store.getters.prevSelectedObject;
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

  &__title {
    padding: 0.4rem 1rem;
    font-size: 0.8rem;
    color: $gray6;
    background-color: $black;
    text-align: center;
  }
}

.block {
  display: block;
  width: 100%;
  padding: .5rem 1rem;
}

.link {
  font-size: 0.75rem;
  color: $blue;
  text-decoration: none;

  .icon {
    margin-right: .5rem;
  }
}
</style>
