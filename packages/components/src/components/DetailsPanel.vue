<template>
  <div class="details-panel">
    <h3 class="details-panel__title">
      <img src="@/assets/appmap-logo.png" alt="" />
      <button
        v-if="appMap.metadata.source_location"
        class="details-panel__view-source"
        type="button"
        @click.prevent="viewSource"
      >
        <EyeIcon class="details-panel__view-source-icon" />
        View source
      </button>
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
import { Event, AppMap } from '@appland/models';
import EyeIcon from '@/assets/eye.svg';
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

export default {
  name: 'v-details-panel',
  components: {
    EyeIcon,
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

  methods: {
    viewSource() {
      this.$root.$emit('viewSource', this.appMap.metadata.source_location);
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
  background-color: $vs-code-gray1;
  word-break: break-word;
  border-right: 1px solid $base15;
  overflow: auto;

  &__title {
    margin-bottom: 1rem;
    font-size: 0;
    display: flex;
    align-items: center;

    svg {
      max-width: 10rem;
    }
  }

  &__view-source {
    margin-left: auto;
    display: inline-flex;
    align-items: flex-start;
    border: 0;
    border-radius: 0;
    padding: 0.2rem 0;
    background-color: transparent;
    color: $gray4;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 400;
    font-style: normal;
    text-decoration: none;
    user-select: none;
    outline: none;
    cursor: pointer;
    appearance: none;
    transition: color 0.3s ease-in;

    &:hover,
    &:active {
      color: $gray5;
      transition-timing-function: ease-out;
    }

    &-icon {
      margin-right: 0.25rem;
      width: 1em;
      height: 1em;
      fill: currentColor;
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
      padding: 0 0 1rem;
    }
  }

  &__notification:not(:empty) {
    padding: 0 2rem 2rem;
  }
}
</style>
