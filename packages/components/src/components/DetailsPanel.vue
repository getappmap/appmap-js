<template>
  <div class="details-panel">
    <h3 class="details-panel__title">
      <div class="details-panel__ask-navie-wrapper" v-if="showAskNavie">
        <div
          class="details-panel__ask-navie-button"
          data-cy="details-panel-ask-navie-button"
          @click="() => this.$emit('askNavieAboutMap')"
        >
          <CompassIcon class="compass-icon" />
          <div>Ask Navie</div>
        </div>
      </div>
      <AppMapLogo v-else width="70" />
      <ChevronDownIcon
        class="details-panel__hide-panel-icon"
        @click="() => this.$emit('hideDetailsPanel')"
      />
    </h3>

    <div
      v-if="isGiantAppMap"
      class="details-panel__notification blocked"
      data-cy="giant-map-sidebar-notification"
    >
      <div class="content">
        <p class="notification-head">
          <ExclamationIcon /><strong>This AppMap is too large to open.</strong>
        </p>
        <p>
          To learn more about making your AppMaps smaller, please see our
          <a href="https://appmap.io/docs/reference/handling-large-appmaps.html">documentation</a>.
        </p>
      </div>
    </div>

    <div
      v-if="wasAutoPruned"
      class="details-panel__notification trimmed"
      data-cy="pruned-map-sidebar-notification"
    >
      <div class="content">
        <p class="notification-head">
          <ScissorsIcon /><strong>This AppMap has been automatically pruned.</strong>
        </p>
        <p>
          This AppMap is too large, so we removed some functions. Please see the
          <a href="#" data-cy="stats-panel-link" @click.prevent="openStatsPanel">Stats panel</a> for
          more information.
        </p>
      </div>
    </div>

    <div
      class="details-panel__source"
      v-if="!selectedObject && !selectedLabel && sourceLocationObject"
    >
      <v-source-code-link :object="sourceLocationObject" />
    </div>
    <div class="details-panel__content">
      <div v-if="selectedObject">
        <div class="details-panel__selection-nav">
          <NavArrow
            @click="goBack"
            :class="[
              'details-panel__selection-nav-icon',
              'arrow-left',
              canGoBack ? '' : 'disabled',
            ]"
          />
          <NavArrow
            @click="goForward"
            :class="[
              'details-panel__selection-nav-icon',
              'arrow-right',
              canGoForward ? '' : 'disabled',
            ]"
          />
          <select
            v-model="currentSelection"
            class="selection-nav-menu"
            data-cy="select-object"
            @change="selectObject"
          >
            <option v-for="selection in selectionStack" :key="selection.fqid" :value="selection">
              {{ displayName(selection) }}
            </option>
          </select>
          <div class="details-panel__selection-nav-icon-container">
            <ClearIcon
              class="details-panel__selection-nav-icon clear-selections-icon"
              @click="() => this.$emit('clearSelections')"
            />
            <div class="tooltip">Clear all selections</div>
          </div>
        </div>
      </div>
      <keep-alive>
        <v-details-search
          v-if="!isGiantAppMap && !selectedObject && !selectedLabel"
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
import NavArrow from '@/assets/nav-arrow.svg';
import ClearIcon from '@/assets/x-icon.svg';
import ChevronDownIcon from '@/assets/fa-solid_chevron-down.svg';
import CompassIcon from '@/assets/compass-simpler.svg';
import { SELECT_CODE_OBJECT } from '@/store/vsCode';

const MAX_DISPLAY_NAME_LENGTH = 150;

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
    NavArrow,
    ClearIcon,
    ChevronDownIcon,
    CompassIcon,
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
    wasAutoPruned: {
      type: Boolean,
      default: false,
    },
    isGiantAppMap: {
      type: Boolean,
      default: false,
    },
    showAskNavie: {
      type: Boolean,
      default: true,
    },
  },

  data() {
    return {
      sourceLocation: null,
      sourceLocationError: null,
      currentSelection: null,
    };
  },

  computed: {
    selectionStack() {
      return this.$store.state.selectionStack;
    },
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
    currentSelectionIndex() {
      return this.selectionStack?.findIndex(
        (selection) => selection.id === this.currentSelection?.id
      );
    },
    canGoBack() {
      return this.currentSelectionIndex > 0;
    },
    canGoForward() {
      return this.selectionStack.length > this.currentSelectionIndex + 1;
    },
  },
  methods: {
    openStatsPanel() {
      this.$emit('openStatsPanel');
    },
    displayName(selection) {
      let displayName = '';

      if (selection.event === 'call') {
        displayName = String(selection);
      } else if (selection.type === 'analysis-finding') {
        displayName = selection.name;
      } else if (selection.type === 'edge') {
        displayName = this.displayName(selection.from) + ' -> ' + this.displayName(selection.to);
      } else {
        displayName = selection.prettyName || selection.name;
      }

      return displayName.length > MAX_DISPLAY_NAME_LENGTH
        ? displayName.slice(0, MAX_DISPLAY_NAME_LENGTH) + '...'
        : displayName;
    },
    goBack() {
      const selection = this.selectionStack[this.currentSelectionIndex - 1];
      this.$store.commit(SELECT_CODE_OBJECT, selection);
    },
    goForward() {
      const selection = this.selectionStack[this.currentSelectionIndex + 1];
      this.$store.commit(SELECT_CODE_OBJECT, selection);
    },
    selectObject() {
      this.$store.commit(SELECT_CODE_OBJECT, this.currentSelection);
    },
  },
  updated() {
    this.currentSelection = this.selectedObject;
  },
  mounted() {
    this.currentSelection = this.selectedObject;
  },
};
</script>

<style scoped lang="scss">
$glow-size: 0.2rem;
$glow-blur: 0.5rem;
$glow-alpha: 0.5;
@keyframes pan {
  0%,
  100% {
    background-position: 0% 0%;
    box-shadow: 0 0 $glow-blur $glow-size rgba(255, 7, 170, $glow-alpha);
  }
  25%,
  75% {
    background-position: 100% 100%;
    box-shadow: 0 0 $glow-blur $glow-size rgba(156, 47, 186, $glow-alpha);
  }
  50% {
    background-position: 100% 100%;
    box-shadow: 0 0 $glow-blur $glow-size rgba(67, 98, 177, $glow-alpha);
  }
}

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

  &__ask-navie-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    background: $navie-gradient;
    border-radius: $border-radius;
    padding: 4px;
    animation: pan 5s linear infinite;
    background-size: 300% 300%;
  }

  &__ask-navie-button {
    padding: 0.5rem 0.75rem;
    background: rgba(26, 40, 78, 0.75);
    border-radius: calc(#{$border-radius} - 2px);
    font-size: 0.9rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    width: fit-content;
    color: $gray5;
    transition: $transition;

    .compass-icon {
      width: 28px;
      margin: -0.25rem 0.5rem -0.25rem 0;

      path {
        transition: $transition;
        fill: $gray5;
      }

      circle {
        transition: $transition;
        stroke: $gray5;
      }
    }

    &:hover {
      cursor: pointer;
      color: #fff;
      transition: $transition;
      background: rgba(255, 255, 255, 0.2);

      .compass-icon {
        path {
          transition: $transition;
          fill: #fff;
        }

        circle {
          transition: $transition;
          stroke: #fff;
        }
      }
    }
  }

  &__title {
    margin-bottom: 1rem;
    font-size: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;

    svg {
      max-width: 20rem;
      width: 100%;
    }
  }

  &__hide-panel-icon {
    fill: $gray6;
    width: 14px !important;
    transform: rotate(90deg);

    &:hover {
      cursor: pointer;
      fill: $blue;
      transition: $transition;
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

  &__selection-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1.7rem;

    &-icon {
      margin: 0 0.3rem;
      fill: white;

      &:hover {
        cursor: pointer;
        fill: $blue;
        transition: $transition;
      }

      &-container {
        overflow: hidden;
        white-space: nowrap;

        .clear-selections-icon {
          width: 1.2rem;
        }

        .tooltip {
          position: absolute;
          background-color: #fff;
          color: #000;
          font-size: 0.9rem;
          border: 1px solid #ccc;
          padding: 5px;
          z-index: 5;
          opacity: 0.9;
          display: none;
        }
        &:hover .tooltip {
          display: inline-block;
        }
      }
    }

    .arrow-left,
    .arrow-right {
      width: 1.7rem;
    }

    .arrow-left {
      transform: rotate(180deg);
    }

    .disabled {
      fill: $gray3;
      pointer-events: none;

      &:hover {
        cursor: default;
        fill: $gray3;
      }
    }

    select {
      margin: 0 0.5rem;
      padding: 0.25rem 0.5rem;
      border-radius: $border-radius;
      background-color: $gray2;
      color: $gray6;
      border: 1px solid $gray3;
      font-size: 0.9rem;
      font-weight: 400;
      width: 100%;

      &:hover {
        cursor: pointer;
        background-color: $gray3;
        transition: $transition;
      }

      &:focus-visible {
        outline: none;
      }
    }
  }

  &__notification {
    padding: 0.5rem 0.75rem;
    background-color: $gray2;
    border-radius: $border-radius;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    svg {
      width: 1rem;
      height: 1rem;
      fill: $white;
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
