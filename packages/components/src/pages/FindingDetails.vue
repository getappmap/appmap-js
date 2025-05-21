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
          <div class="col" v-if="rpcClient">
            <v-button kind="primary" @click.native="fix()">
              <component :is="fixIcon" class="fix-icon" />
              <div class="fix-text">
                <span>{{ fixLabel }}</span>
                <div class="fix-text--sub-text" v-if="fixState">Click to view results</div>
              </div>
            </v-button>
          </div>
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

<script lang="ts">
// @ts-nocheck
import VQuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import Navigation from '@/components/mixins/navigation';
import VAppmapPin from '@/assets/appmap-pin.svg';
import VPopper from '@/components/Popper.vue';
import VButton from '@/components/Button.vue';
import AppMapRPC from '@/lib/AppMapRPC';
import VLoader from '@/components/chat/Loader.vue';
import VWrench from '@/assets/wrench.svg';
import VCheck from '@/assets/check.svg';
import { PropType } from 'vue';
import { method } from 'jayson';

export default {
  name: 'FindingDetails',

  components: {
    VQuickstartLayout,
    VAppmapPin,
    VPopper,
    VButton,
    VLoader,
    VWrench,
    VCheck,
  },

  mixins: [Navigation],

  props: {
    findings: {
      default: () => [],
      type: Array as PropType<any[]>,
    },
    appmapRpcPort: {
      type: Number as PropType<number | undefined>,
      default: undefined,
    },
  },

  data() {
    return {
      fixState: undefined as undefined | 'in-progress' | 'complete',
      threadId: undefined as undefined | string,
      rpcClient: this.appmapRpcPort ? new AppMapRPC(this.appmapRpcPort) : undefined,
    };
  },

  methods: {
    displayLocation(location: any) {
      const lineNumber = location.range[0] && location.range[0].line + 1;
      const { truncatedPath } = location;
      if (lineNumber && lineNumber > 1) {
        return `${truncatedPath}:${lineNumber}`;
      }
      return `${truncatedPath}`;
    },

    openInSourceCode(location: any) {
      this.$root.$emit('open-in-source-code', location);
    },

    openMap(mapFile: any, uri: any) {
      this.$root.$emit('open-map', mapFile, uri);
    },

    backToOverview() {
      this.$root.$emit('open-findings-overview');
    },

    async fix() {
      console.log(this.threadId, this.fixState, JSON.stringify(this.findings));
      if (this.threadId) {
        this.$root.$emit('open-navie-thread', this.threadId);
        return;
      }

      if (this.fixState) return;
      this.fixState = 'in-progress';

      const { rpcClient } = this;
      const registration = await rpcClient.register();
      this.threadId = registration.thread.id;

      const listener = await rpcClient.thread.subscribe(registration.thread.id);
      const { finding } = this.representativeFinding;
      const req = finding?.event?.['http_server_request'];
      const query = finding?.event?.['sql_query'];
      const relatedClasses = new Set<string>(
        (finding.relatedEvents ?? []).map(({ defined_class, method }) => {
          if (method === undefined) {
            return defined_class;
          }
          return `${defined_class}#${method}`;
        })
      );

      const messageQueue = [
        [
          '@explain /gather identify and explain the root cause of the following issue.',
          `The issue is described as "${this.title}"`,
          this.description,
          '\nDetails are as follows:',
          this.message,
          finding?.locationLabel,
          finding?.event?.path,
          req && `${req.method} ${req.path}`,
          query && `SQL: ${query.sql}`,
          ...[...relatedClasses],
          ...this.representativeFinding.stackLocations.map((l: any) => this.displayLocation(l)),
        ]
          .filter(Boolean)
          .join('\n'),
        '@plan a concise resolution to the issue, keeping changes to the minimum necessary - be specific and precise in your response, and always follow best practices.',
        '@generate /format=xml',
      ];
      let currentMessageComplete: Promise<void>;
      let resolver: () => void;
      listener.on('event', (e) => {
        if (e.type === 'message-complete') {
          if (resolver) resolver();
        }
      });
      for (const message of messageQueue) {
        currentMessageComplete = new Promise((resolve) => {
          resolver = resolve;
        });

        await rpcClient.thread.sendMessage(registration.thread.id, message);
        await currentMessageComplete;
      }

      this.fixState = 'complete';
    },
  },

  computed: {
    fixIcon() {
      switch (this.fixState) {
        case 'in-progress':
          return VLoader;
        case 'complete':
          return VCheck;
        default:
          return VWrench;
      }
    },

    fixLabel() {
      switch (this.fixState) {
        case 'in-progress':
          return 'Generating Fix...';
        case 'complete':
          return 'Fix Generated';
        default:
          return 'Fix with Navie';
      }
    },

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

.fix-icon {
  width: 16px !important;
  margin-right: 0.5rem;
  &::v-deep {
    .dot {
      background-color: $white;
    }
  }
  path {
    fill: $white;
  }
}
.fix-text {
  &--sub-text {
    font-size: 0.8rem;
    opacity: 0.65;
    font-weight: 200;
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
