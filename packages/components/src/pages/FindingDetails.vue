<template>
  <v-quickstart-layout>
    <section v-if="hasNoData" class="finding-details">
      <h1 data-cy="title">Oops, Something Went Wrong!</h1>
      <p>We couldn't find any information about this finding</p>
    </section>
    <div v-else>
      <section class="finding-details">
        <div class="header-wrap">
          <header>
            <h4 class="subhead">Finding</h4>
            <h1 data-cy="title">{{ title }}</h1>
            <p v-if="description" data-cy="description">{{ description }}</p>
            <a :href="docsLink" data-cy="docs-link">Learn More</a>
          </header>
          <div class="header-controls">
            <!-- TODO
          <div class="btn">Status: <strong>New</strong></div>
          <div class="btn">Share</div>
          -->
            <div class="btn" @click="backToOverview()">Open Findings Overview</div>
          </div>
        </div>

        <main>
          <div class="finding-details-wrap row">
            <div class="findings-overview">
              <h3>Finding Overview</h3>
              <ul class="card stack">
                <!-- TODO
              <li>Time: 2022-05-19 22:35:49 UTC</li>
              <li>Status: New</li>
              <li>Commit: <a href="/">1ea201b</a></li>
              -->
                <li data-cy="category">Category: {{ category }}</li>
                <li data-cy="reference" v-for="(link, reference) in references" :key="reference">
                  Reference: <a :href="link">{{ reference }}</a>
                </li>
              </ul>
            </div>
            <div class="event-summary" data-cy="event-summary">
              <h3>Event Summary</h3>
              <ul class="card stack">
                <li>
                  <span class="code"> {{ message }}</span>
                </li>
              </ul>
            </div>
          </div>
          <div class="stack-trace finding-details-wrap col">
            <h3>Stack Trace</h3>
            <ul class="card">
              <li v-for="location in stackLocations" :key="location.uri.path" data-cy="stack-trace">
                <v-popper
                  class="hover-text-popper"
                  data-cy="popper"
                  :text="location.uri.path"
                  placement="top"
                  text-align="left"
                >
                  <a href="#" @click.prevent="openInSourceCode(location)">{{
                    displayLocation(location)
                  }}</a>
                </v-popper>
              </li>
            </ul>
          </div>
        </main>
      </section>
      <div class="analysis-findings full-width">
        <h3 data-cy="associated-maps-title">
          <VAppmapPin />
          Found in {{ associatedMaps.length }} AppMap{{
            associatedMaps.length === 1 ? undefined : 's'
          }}
        </h3>
        <ul class="appmap-list">
          <li v-for="map in associatedMaps" :key="map.fullPath" data-cy="associated-map">
            <a href="#" @click.prevent="openMap(map.fullPath, map.uri)">{{ map.appMapName }}</a>
          </li>
        </ul>
      </div>
    </div>
  </v-quickstart-layout>
</template>

<script>
import VQuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import Navigation from '@/components/mixins/navigation';
import VAppmapPin from '@/assets/appmap-pin.svg';
import VPopper from '@/components/Popper.vue';
import emitter from '@/lib/eventBus';

export default {
  name: 'FindingDetails',

  components: {
    VQuickstartLayout,
    VAppmapPin,
    VPopper,
  },

  mixins: [Navigation],

  props: {
    findings: {
      default: () => [],
      type: Array,
    },
  },

  methods: {
    displayLocation(location) {
      const lineNumber = location.range[0] && location.range[0].line + 1;
      const { truncatedPath } = location;
      if (lineNumber && lineNumber > 1) {
        return `${truncatedPath}:${lineNumber}`;
      }
      return `${truncatedPath}`;
    },

    openInSourceCode(location) {
      emitter.emit('open-in-source-code', location);
    },

    openMap(mapFile, uri) {
      emitter.emit('open-map', mapFile, uri);
    },

    backToOverview() {
      emitter.emit('open-findings-overview');
    },
  },

  computed: {
    hasNoData() {
      return this.findings.length === 0;
    },

    representativeFinding() {
      return this.findings[0];
    },

    associatedMaps() {
      return this.findings.map((finding) => {
        const uri = finding.appMapUri;
        const fullPath = finding.finding.appMapFile;
        const { appMapName } = finding;

        return {
          fullPath,
          appMapName,
          uri,
        };
      });
    },

    stackLocations() {
      return this.representativeFinding.stackLocations;
    },

    category() {
      return this.representativeFinding.finding.impactDomain;
    },

    title() {
      return this.representativeFinding.finding.ruleTitle;
    },

    message() {
      return this.representativeFinding.finding.message;
    },

    description() {
      return this.representativeFinding.ruleInfo && this.representativeFinding.ruleInfo.description;
    },

    references() {
      return (
        (this.representativeFinding.ruleInfo && this.representativeFinding.ruleInfo.references) ||
        {}
      );
    },

    docsLink() {
      return `https://appmap.io/docs/analysis/rules-reference.html#${this.representativeFinding.finding.ruleId}`;
    },
  },
};
</script>
<style lang="scss" scoped>
.qs .header-controls a {
  color: $white;
}
.analysis-findings.full-width {
  padding-bottom: 2rem;
  h3 {
    display: flex;
    align-items: center;
    padding: 0 2rem;
    color: $gray4;
    svg {
      margin-right: 0.5rem;
    }
  }
  .appmap-list {
    padding: 0;
    border-top: 1px solid lighten($gray2, 15);
    margin-top: 0.25rem;
    li {
      padding: 0.5rem 2rem;
      border-bottom: 1px solid lighten($gray2, 15);
      list-style-type: none;

      a {
        color: $white;
      }
      &:hover {
        background-color: darken($gray2, 05);
      }
    }
  }
}

h1,
h2,
h3,
h4,
h5,
h6 {
  margin: 0;
}

.finding-details {
  padding: 2rem;
  .header-wrap {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    h4.subhead {
      margin-top: 0;
    }
    header {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      p {
        margin: 0;
      }
    }
    .header-controls {
      display: flex;
      flex-direction: row;
      gap: 1rem;
      align-items: flex-start;
      justify-content: flex-end;
      width: 100%;
      position: absolute;
      right: 2rem;
      .btn {
        border: 1px solid $white;
        border-radius: 0.5rem;
        padding: 0.2rem 0.5rem;
        transition: $transition;
        min-width: 200px;
        text-align: center;
        &:hover {
          background-color: $gray1;
          border-color: $gray1;
          color: $white;
          cursor: pointer;
        }
      }
    }
  }
  section {
    .code {
      font-family: monospace;
      font-weight: 800;
    }
  }
  .subhead {
    font-size: 1.1rem;
    color: $gray4;
    line-height: 1.6rem;
    text-transform: uppercase;
    padding: 0.2rem 0;
  }

  .findings-sort {
    display: flex;
    flex-direction: row;
    align-items: center;
    select {
      border-radius: 6px;
      border: 1px solid $purps3;
      background-color: transparent;
      color: $white;
      padding: 0.4rem 0.5rem;
      margin-left: 0.35rem;
    }
  }

  .finding-details-wrap {
    display: flex;
    gap: 1.25rem;
    justify-content: space-between;
    &.row {
      flex-direction: row;
    }
    &.col {
      flex-direction: column;
      gap: 0;
    }
    h3 {
      color: $gray4;
    }
    ul {
      list-style-type: none;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      justify-content: flex-start;
      padding: 0;
      width: 100%;
      li {
        border-radius: $border-radius;
        background-color: $gray1;
        padding: 0.25rem 1rem 0.25rem 1.5rem;
        transition: $transition;
      }
      &.card {
        margin-top: 0.25rem;
      }
    }
    section {
      .code {
        font-weight: 800;
        color: $gray4;
        font-family: monospace;
      }
    }
    .card {
      border-radius: 0.5rem;
      background-color: $gray1;
      padding: 0.25rem 0;
      gap: 0;
      margin-top: 0.15rem;
      li {
        border-bottom: 1px solid $gray2;
        border-radius: 0;
        word-break: break-word;
        &:last-of-type {
          border-bottom: 0;
        }
      }
      &ul.stack {
        display: flex;
        flex-direction: column;
      }
    }
    .findings-overview,
    .event-summary {
      width: 100%;
      min-width: 48%;
    }
  }

  .findings-list {
    margin: 0 -1.75rem;
    ul {
      padding: 0;
      list-style-type: none;
      li {
        padding: 0.25rem 1rem;
        width: 100%;
        transition: $transition;
        &:hover {
          background-color: darken($gray2, 05);
        }
      }
    }
  }
  &.full-width {
    width: 100%;
    margin: 0 -1.75rem;
  }
}

.b-0 {
  border: none;
}

@media (maz-width: 1000px) {
}

@media (max-width: 900px) {
  .finding-details {
    .header-wrap {
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      header {
        margin: 0;
        p {
          margin-bottom: 0;
        }
      }
    }
  }
}

@media (max-width: 800px) {
  .finding-details {
    .finding-details-wrap {
      &.row {
        flex-direction: column;
        gap: 0;
      }
    }
  }
}

@media (max-width: 500px) {
  .finding-details {
    .header-wrap .header-controls {
      position: unset;
      justify-content: flex-start;
    }
    .header-wrap {
      header {
        h1 {
          margin-bottom: 0.25rem;
        }
      }
    }
  }
}
</style>
