<template>
  <div class="details-panel-analysis-finding">
    <v-details-panel-header
      object-type="Analysis finding"
      :object="object"
      :title="resolvedFinding.rule.title"
    >
    </v-details-panel-header>
    <section>
      <p data-cy="rule-description">{{ resolvedFinding.rule.description }}</p>
      <a :href="resolvedFinding.rule.url">Learn more</a>
    </section>
    <section>
      <v-details-panel-list-header>Overview</v-details-panel-list-header>
      <ul>
        <li>Impact category: {{ finding.impactDomain }}</li>
        <li v-for="(link, reference) in resolvedFinding.rule.references" :key="reference">
          Reference: <a :href="link">{{ reference }}</a>
        </li>
      </ul>
    </section>
    <v-details-panel-text title="Event summary">
      {{ finding.message || finding.groupMessage }}
    </v-details-panel-text>
    <v-details-panel-stack-trace :stack-locations="resolvedFinding.stackLocations" />
    <v-details-panel-list title="Related events" :items="relatedEvents" :event-quickview="true" />
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';
import VDetailsPanelListHeader from '@/components/DetailsPanelListHeader.vue';
import VDetailsPanelStackTrace from '@/components/DetailsPanelStackTrace.vue';
import VDetailsPanelText from '@/components/DetailsPanelText.vue';

export default {
  name: 'v-details-panel-analysis-finding',
  components: {
    VDetailsPanelList,
    VDetailsPanelListHeader,
    VDetailsPanelHeader,
    VDetailsPanelStackTrace,
    VDetailsPanelText,
  },
  props: {
    object: {
      type: Object,
      required: true,
    },
    appMap: {
      type: Object,
    },
  },
  computed: {
    finding() {
      return this.resolvedFinding.finding;
    },
    resolvedFinding() {
      return this.object.resolvedFinding;
    },
    relatedEvents() {
      if (this.appMap) {
        return (this.finding.relatedEvents || []).map((e) => this.appMap.getEvent(e.id));
      }
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel-analysis-finding {
  h3 {
    padding: 0;
  }

  ul {
    list-style-type: none;
    margin-top: 0;
    padding: 0.25rem 0.5rem;
    li {
      border-bottom: 1px solid #242c41a3;
      padding: 0.5rem 0;
      &:last-of-type {
        border: 0;
        padding: 0.5rem 0 0 0;
      }
      &:first-of-type {
        padding-top: 0;
      }
    }
  }

  a {
    color: $blue;
    text-decoration: none;
    line-height: 1.5rem;
    width: 100%;
    word-break: break-all;
    transition: $transition;
    &:hover {
      text-decoration: underline;
      color: lighten($blue, 20);
    }
  }
  section {
    margin-bottom: 16px;
  }
}
</style>
