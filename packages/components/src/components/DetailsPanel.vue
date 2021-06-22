<template>
  <div class="details-panel">
    <h3 class="details-panel__title">
      <ApplandLogo />
    </h3>
    <div class="details-panel__content">
      <div class="details-panel__notification">
        <slot name="notification" />
      </div>
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
import ApplandLogo from '@/assets/appland-logo.svg';
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
import { Event, AppMap } from '@appland/models';

export default {
  name: 'v-details-panel',
  components: {
    ApplandLogo,
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
  color: $gray6;
  background-color: $vs-code-gray1;
  word-break: break-word;
  border-right: 1px solid $base15;
  overflow: auto;

  &__title {
    padding: 2rem;
    margin: 0;

    svg {
      max-width: 10rem;
    }
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
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;

    &:not(:empty) {
      padding: 0 2rem 1rem;
    }
  }

  &__notification:not(:empty) {
    padding: 0 2rem 2rem;
  }
}
</style>
