<template>
  <div class="details-panel">
    <h3 class="details-panel__title">
      <AppMapLogo width="70" />
    </h3>

    <div class="details-panel__notification blocked">
      <div class="content">
        <p class="notification-head">
          <ExclamationIcon /><strong>This AppMap is too large to open.</strong>
        </p>
        <p>
          To learn more about making your AppMaps smaller, please see our
          <a href="/">documentation</a>.
        </p>
      </div>
    </div>

    <div class="details-panel__notification trimmed">
      <div class="content">
        <p class="notification-head">
          <ScissorsIcon /><strong>This AppMap has been automatically trimmed.</strong>
        </p>
        <p>
          We have identified functions that my impact performance of yoru AppMap, and removed them
          from this map. Please see our <a href="/">documentation</a> for more information on how to
          optimize your AppMaps.
        </p>
      </div>
    </div>

    <div class="details-panel__notification">
      <FeedbackIcon />
      Help us improve AppMap.
      <a href="https://appmap.io/product/feedback/general.html">Send your feedback.</a>
    </div>
    <div
      class="details-panel__source"
      v-if="!selectedObject && !selectedLabel && sourceLocationObject"
    >
      <v-source-code-link :object="sourceLocationObject" />
    </div>
    <div class="details-panel__content">
      <div class="details-panel__buttons">
        <slot name="buttons" />
      </div>
      <keep-alive>
        <v-details-search
          v-if="!selectedObject && !selectedLabel"
          :appMap="appMap"
          :findings="findings"
          @onChangeFilter="(value) => this.$emit('onChangeFilter', value)"
        />
      </keep-alive>
      <component
        v-if="selectedObject"
        :is="detailsType"
        :object="selectedObject"
        :is-root-object="isRootObject"
        :filters-root-objects="filtersRootObjects"
        :appMap="appMap"
      />
      <v-details-panel-labels
        v-if="selectedObject && selectedObject.labels"
        :items="Array.from(selectedObject.labels)"
      />
      <v-details-label v-if="selectedLabel" :label="selectedLabel" :appMap="appMap" />
    </div>
  </div>
</template>

<script>
import { Event, AppMap } from '@appland/models';
import AppMapLogo from '@/assets/appmap-full-logo.svg';

import VDetailsLabel from '@/components/DetailsLabel.vue';
import VDetailsPanelAnalysisFinding from '@/components/DetailsPanelAnalysisFinding.vue';
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
import VSourceCodeLink from '@/components/SourceCodeLink.vue';
import FeedbackIcon from '@/assets/feedback-icon.svg';
import ExclamationIcon from '@/assets/exclamation-circle.svg';
import ScissorsIcon from '@/assets/scissors-icon.svg';

export default {
  name: 'v-details-panel',
  components: {
    AppMapLogo,
    VDetailsLabel,
    VDetailsPanelAnalysisFinding,
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
    VSourceCodeLink,
    FeedbackIcon,
    ExclamationIcon,
    ScissorsIcon,
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
    findings: {
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
    sourceLocationObject() {
      let sourceLocation;
      if (this.appMap && this.appMap.metadata) {
        sourceLocation = this.appMap.metadata.source_location;
      }
      return sourceLocation;
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

  &__source {
    margin-bottom: 1rem;

    &-title {
      margin: 0 0 0.25rem;
      font-size: 0.75rem;
      font-weight: 400;
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
    flex-direction: row-reverse;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 0.5rem;

    button {
      margin-bottom: 1rem;
    }
  }

  &__notification {
    padding: 0.5rem 0.75rem;
    background-color: $gray2;
    border-radius: $border-radius;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    svg {
      width: 1.5rem;
      height: 1rem;
    }
    a {
      color: lighten($blue, 15);
      transition: $transition;
      &:hover {
        color: $blue;
      }
    }
    p {
      margin: 0 0 0.5rem 0;
    }
    p.notification-head {
      display: flex;
      align-items: center;
      flex-direction: row;
      gap: 0.5rem;
      margin: 0.5rem 0;
    }
    &.blocked {
      background-color: #d1245c;
      a {
        color: $white;
      }
    }
    &.trimmed {
      background-color: #c07d1b;
      a {
        color: $white;
      }
    }
  }
}
</style>
