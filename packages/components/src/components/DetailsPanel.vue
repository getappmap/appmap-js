<template>
  <div class="details-panel">
    <h3 class="details-panel__title">
      <AppMapLogo width="70" />
    </h3>
    <div class="details-panel__content">
      <div class="details-panel__buttons">
        <slot name="buttons" />
      </div>
      <keep-alive>
        <v-details-search
          v-if="!selectedObject && !selectedLabel"
          :appMap="appMap"
        />
      </keep-alive>
      <component
        v-if="selectedObject"
        :is="detailsType"
        :object="selectedObject"
        :is-root-object="isRootObject"
        :filters-root-objects="filtersRootObjects"
      />
      <v-details-panel-labels
        v-if="selectedObject && selectedObject.labels"
        :items="Array.from(selectedObject.labels)"
      />
      <v-details-label
        v-if="selectedLabel"
        :label="selectedLabel"
        :appMap="appMap"
      />
    </div>
  </div>
</template>

<script>
import { Event, AppMap } from '@appland/models';
import AppMapLogo from '@/assets/appmap-full-logo.svg';
import VDetailsLabel from '@/components/DetailsLabel.vue';
import VDetailsPanelClass from '@/components/DetailsPanelClass.vue';
import VDetailsPanelDatabase from '@/components/DetailsPanelDatabase.vue';
import VDetailsPanelEdge from '@/components/DetailsPanelEdge.vue';
import VDetailsPanelEvent from '@/components/DetailsPanelEvent.vue';
import VDetailsPanelFunction from '@/components/DetailsPanelFunction.vue';
import VDetailsPanelHttp from '@/components/DetailsPanelHttp.vue';
import VDetailsPanelPackage from '@/components/DetailsPanelPackage.vue';
import VDetailsPanelQuery from '@/components/DetailsPanelQuery.vue';
import VDetailsPanelRoute from '@/components/DetailsPanelRoute.vue';
import VDetailsPanelExternalService from '@/components/DetailsPanelExternalService.vue';
import VDetailsPanelLabels from '@/components/DetailsPanelLabels.vue';
import VDetailsSearch from '@/components/DetailsSearch.vue';
import VPopper from '@/components/Popper.vue';

export default {
  name: 'v-details-panel',
  components: {
    AppMapLogo,
    VDetailsLabel,
    VDetailsPanelClass,
    VDetailsPanelDatabase,
    VDetailsPanelEdge,
    VDetailsPanelEvent,
    VDetailsPanelFunction,
    VDetailsPanelHttp,
    VDetailsPanelPackage,
    VDetailsPanelQuery,
    VDetailsPanelRoute,
    VDetailsPanelExternalService,
    VDetailsPanelLabels,
    VDetailsSearch,
    VPopper,
  },
  props: {
    subtitle: String,
    appMap: AppMap,
    selectedObject: {
      type: Object,
    },
    selectedLabel: {
      type: String,
    },
    filtersRootObjects: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return { sourceLocation: null, sourceLocationError: null };
  },

  computed: {
    detailsType() {
      let kind = 'null';
      window.e = Event;
      if (this.selectedObject && this.selectedObject.type) {
        kind = this.selectedObject.type;
      } else if (this.selectedObject instanceof Event) {
        kind = 'event';
      }
      return `v-details-panel-${kind}`;
    },
    isRootObject() {
      return (
        Array.isArray(this.filtersRootObjects) &&
        this.filtersRootObjects.includes(this.selectedObject.fqid)
      );
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel {
  display: block;
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  min-width: 280px;
  width: 100%;
  height: 100%;
  padding: 1rem;
  color: $gray6;
  word-break: break-word;
  border-right: 1px solid $base15;
  overflow: auto;

  &__title {
    margin-bottom: 1rem;
    font-size: 0;
    display: flex;
    align-items: center;

    svg {
      max-width: 20rem;
      width: 100%;
    }
  }

  &__header-buttons {
    margin-left: auto;
    display: inline-flex;
    align-items: flex-start;
  }

  &__subtitle {
    margin-bottom: 1rem;
    color: $white;
  }

  &__content {
    padding: 0;
  }

  &__buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 0.5rem;

    & > *:last-child {
      margin-bottom: 1rem;
    }
  }
}
</style>
