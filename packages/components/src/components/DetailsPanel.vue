<template>
  <div class="details-panel">
    <h3 class="details-panel__title">
      <AppMapLogo width="70" />
    </h3>
    <div
      class="details-panel__source"
      v-if="!selectedObject && !selectedLabel && sourceLocationObject"
    >
      <v-source-code-link :object="sourceLocationObject" />
    </div>

    <!-- Analysis finding detail -->
    <div class="finding-details">
      <section class="finding-heading">
        <h2>Finding Details</h2>
        <a class="btn btn-breadcrumb" href="/">
          <span class="control back"><VBreadcrumbBack /></span>
          Back</a
        >
      </section>
      <section class="finding-name">
        <h2>N Plus One Query (3)</h2>
        <p class="subhead-margin">
          AppMap has found occurrences of a query being repeated within a loop. This SQL query is
          executed 16 times total in this request.
        </p>
      </section>
      <section class="overview">
        <div class="section-header expando">
          <h3>Overview</h3>
          <span class="control"><VChevronDown /></span>
        </div>
        <div class="section-content">
          <ul class="overview">
            <li>Time: 2022-05-19 22:35:49 UTC</li>
            <li>Status: New</li>
            <li>Impact Category: Maintenance</li>
            <li>Reference: <a href="/">CWE-1073</a></li>
            <li>Commit: <a href="/">1ea201b</a></li>
            <li>Database type: sqlite</li>
            <li>Server version: 3.11.0</li>
          </ul>
        </div>
      </section>
      <section class="message">
        <div class="section-header">
          <h3>Message:</h3>
        </div>
        <p class="code">SELECT “users”. * FROM “users” WHERE “users” . “id” = ? LIMIT ?</p>
      </section>
      <section class="stack-trace">
        <div class="section-header">
          <h3>Stack Trace</h3>
        </div>
        <ul>
          <li><a href="/">.../.rbenv/versions/3.0.2/lib/ruby/3.0.0/psych.rb:273</a></li>
          <li><a href="/">.../land-of-apps/sample_app_6th_ed/app/models/user.rb</a></li>
          <li><a href="/">.../lib/action_controller/metal/instrumentation.rb:18</a></li>
        </ul>
      </section>
      <section class="found-appmaps">
        <div class="section-header left">
          <VAppmapPin />
          <h3>Found in 3 AppMaps</h3>
        </div>
        <ul>
          <li class="expando open">
            <span class="appmap-title">Microposts_interface micropost interface (3)</span>
            <span class="control"><VChevronDown /></span>
          </li>

          <li class="sublist">
            <a href="/">RelatedEvent_Occurrence_01</a>
          </li>
          <li class="sublist">
            <a href="/">RelatedEvent_Occurrence_02</a>
          </li>
          <li class="sublist">
            <a href="/">RelatedEvent_Occurrence_03</a>
          </li>
          <li class="expando">
            <span class="appmap-title">Feed_interface micropost delete (5)</span>
            <span class="control closed"><VChevronDown /></span>
          </li>
          <li class="expando">
            <span class="appmap-title">User_account new password_reset (104)</span>
            <span class="control closed"><VChevronDown /></span>
          </li>
        </ul>
      </section>
    </div>
    <!-- / Analysis finding detail -->

    <div class="details-panel__content">
      <div class="details-panel__notification">
        <slot name="notification" />
      </div>
      <div class="details-panel__buttons">
        <slot name="buttons" />
      </div>
      <keep-alive>
        <v-details-search v-if="!selectedObject && !selectedLabel" :appMap="appMap" />
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
      <v-details-label v-if="selectedLabel" :label="selectedLabel" :appMap="appMap" />
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
import VSourceCodeLink from '@/components/SourceCodeLink.vue';
import VAppmapPin from '@/assets/appmap-pin.svg';
import VExpandCollapse from '@/assets/expand_collapse_icon.svg';
import VBreadcrumbBack from '@/assets/breadcrumb-back.svg';
import VChevronDown from '@/assets/chevron-down.svg';

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
    VSourceCodeLink,
    VAppmapPin,
    VExpandCollapse,
    VBreadcrumbBack,
    VChevronDown,
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
  color: $gray6;
  word-break: break-word;
  border-right: 1px solid $base15;
  overflow: auto;

  &__title {
    margin-bottom: 1rem;
    font-size: 0;
    display: flex;
    align-items: center;
    padding: 1rem 1rem 0 1rem;

    svg {
      max-width: 20rem;
      width: 100%;
    }
  }

  &__source {
    margin-bottom: 1rem;
    padding: 0 1rem;

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
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;

    button {
      margin-bottom: 1rem;
    }
  }
  &__notification:not(:empty) {
    padding: 0 0 1rem;
  }

  // *******************
  // FINDING DETAILS
  // *******************
  .finding-details {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 20rem;
    font-size: 0.9rem;

    section {
      padding: 0 1.5rem;
      .code {
        color: $white;
        margin-top: 0;
        font-family: monospace;
      }
    }
    .finding-heading {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid $gray2;
      h2 {
        margin: 1rem 0;
        text-transform: uppercase;
        color: $hotpink;
        font-size: 1rem;
        font-weight: bold;
      }
      a {
        color: $blue;
        text-decoration: none;
        transition: $transition;
        &:hover {
          text-decoration: underline;
        }
      }
    }
    .heading,
    section {
      border-bottom: 2px solid $gray2;
      &.bt-1 {
        border-top: 2px solid $gray2;
      }
      p {
        color: $white;
      }
      ul {
        list-style-type: none;
        padding: 0;
        margin-top: 0;
        li {
          border-bottom: 1px solid #242c41a3;
          padding: 0.5rem 0;
          &:last-of-type {
            border: 0;
          }
          &:first-of-type {
            padding-top: 0;
          }
        }
        a {
          color: $blue;
          text-decoration: none;
          line-height: 1.5rem;
          width: 100%;
          &:hover {
            text-decoration: underline;
          }
        }
      }

      .section-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        h2 {
          text-transform: uppercase;
          color: $gray4;
          font-size: 0.9rem;
          font-weight: bold;
        }
        &.left {
          justify-content: flex-start;
          gap: 1rem;
        }
      }
      h3 {
        margin: 0.75rem 0;
        font-size: 0.9rem;
        color: $gray4;
        font-weight: 800;
        text-transform: uppercase;
      }
      .expando {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        span {
          color: $gray2;
          &.appmap-title {
            color: $white;
          }
          &.control {
            color: $white;
            svg {
              fill: $white;
            }
            &.rotated-90 {
              rotate: 90deg;
            }
            &:hover {
              svg {
                fill: $blue;
              }
            }
          }
          &:hover {
            cursor: pointer;
            color: $blue;
          }
        }
        .control {
          &.closed {
            rotate: -90deg;
          }
        }
        &.open {
          .control {
            &.closed {
              rotate: -90deg;
            }
          }
        }
      }
      &.found-appmaps {
        ul {
          li {
            &.sublist {
              margin: 0 1rem;
            }
          }
        }
      }
    }

    .finding-name {
      line-height: 1.5rem;
      h3 {
        margin-bottom: 0;
      }
      .subhead-margin {
        margin-top: 0.5rem;
      }
    }
  }
  // *******************
}
</style>
