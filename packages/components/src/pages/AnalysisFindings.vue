<template>
  <v-quickstart-layout>
    <section class="analysis-findings">
      <div class="header-wrap">
        <header>
          <h4 class="subhead">Summary</h4>
          <h1 data-cy="title">Runtime Analysis</h1>
          <!-- TODO
          <h4 class="branch">Branch: feature-update-22</h4>
          -->
        </header>
        <div class="header-controls">
          <div class="btn" data-cy="problems-tab-button" @click="openProblemsTab()">
            Open the <strong>Problems tab</strong>
          </div>
          <!-- TODO
          <div class="btn">Share</div>
          -->
        </div>
      </div>

      <main>
        <div class="findings-wrap">
          <div class="findings-overview">
            <h3>Finding Overview</h3>
            <ul>
              <li class="total" data-cy="category-all" @click="filter('all')">
                All: {{ uniqueFindings.length }}
              </li>
              <li
                v-if="numSecurityFindings"
                class="security"
                data-cy="category-security"
                @click="filter('Security')"
              >
                Security: {{ numSecurityFindings }}
              </li>
              <li
                v-if="numPerformanceFindings"
                class="performance"
                data-cy="category-performance"
                @click="filter('Performance')"
              >
                Performance: {{ numPerformanceFindings }}
              </li>
              <li
                v-if="numStabilityFindings"
                class="stability"
                data-cy="category-stability"
                @click="filter('Stability')"
              >
                Stability: {{ numStabilityFindings }}
              </li>
              <li
                v-if="numMaintainabilityFindings"
                class="maintainability"
                data-cy="category-maintainability"
                @click="filter('Maintainability')"
              >
                Maintainability: {{ numMaintainabilityFindings }}
              </li>
            </ul>
          </div>

          <div class="findings-list">
            <ul class="list">
              <li data-cy="finding-table">
                <ul class="item header">
                  <li
                    class="finding-name"
                    data-cy="column-header-name"
                    @click="sortFindings('name')"
                  >
                    <h3>Finding Name</h3>
                  </li>
                  <!-- TODO
                  <li><h3>Status</h3></li>
                  -->
                  <li data-cy="column-header-category" @click="sortFindings('category')">
                    <h3>Category</h3>
                  </li>
                </ul>
              </li>
              <li
                v-for="[ruleTitle, impactDomain, hash] in sortedFindingsInfo"
                :key="hash"
                data-cy="finding"
              >
                <ul class="item" @click="openFindingInfo(hash)">
                  <li class="finding-name">{{ ruleTitle }}</li>
                  <!-- TODO
                  <li>New</li>
                  -->
                  <li>{{ impactDomain }}</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </section>
  </v-quickstart-layout>
</template>

<script>
import VQuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';

export default {
  name: 'analysis-findings',

  components: {
    VQuickstartLayout,
  },

  props: {
    findings: {
      default: () => [],
      type: Array,
    },
  },

  data() {
    return {
      sortBy: 'name',
      sortAscending: true,
      sortedFindingsInfo: this.getUniqueFindings(),
    };
  },

  watch: {
    findings(newVal) {
      this.findings = newVal;
    },
  },

  methods: {
    sortFindings(sortBy) {
      if (this.sortBy === sortBy) {
        this.sortAscending = !this.sortAscending;
      }

      this.sortBy = sortBy;
      if (this.sortBy === 'category') {
        this.sortFindingsByCategory();
      } else if (this.sortBy === 'name') {
        this.sortFindingsByName();
      }
    },

    sortFindingsByName() {
      this.sortedFindingsInfo.sort((a, b) => {
        if (this.sortAscending) {
          return a[0] < b[0] ? -1 : 1;
        }
        return a[0] < b[0] ? 1 : -1;
      });
    },

    sortFindingsByCategory() {
      this.sortedFindingsInfo.sort((a, b) => {
        if (this.sortAscending) {
          return a[1] < b[1] ? -1 : 1;
        }
        return a[1] < b[1] ? 1 : -1;
      });
    },

    getUniqueFindings() {
      const uniqueFindings = this.groupFindingsByHash();

      return Object.keys(uniqueFindings).map((hash) => {
        const firstFinding = uniqueFindings[hash][0];
        const { ruleTitle, impactDomain } = firstFinding.finding;

        return [ruleTitle, impactDomain, hash];
      });
    },

    groupFindingsByHash() {
      return this.findings.reduce((accumulator, finding) => {
        const hash = finding.finding.hash_v2;

        if (hash in accumulator) {
          accumulator[hash].push(finding);
        } else {
          accumulator[hash] = [finding];
        }

        return accumulator;
      }, {});
    },

    filter(impactDomain) {
      this.sortedFindingsInfo = this.getUniqueFindings();
      this.sortFindings(this.sortBy);

      if (impactDomain !== 'all') {
        this.sortedFindingsInfo = this.sortedFindingsInfo.filter(
          (info) => info[1] === impactDomain
        );
      }
    },

    openFindingInfo(hash) {
      this.$root.$emit('open-finding-info', hash);
    },

    openProblemsTab() {
      this.$root.$emit('open-problems-tab');
    },
  },

  computed: {
    uniqueFindings() {
      const seen = {};
      return this.findings.filter((finding) => {
        const hash = finding.finding.hash_v2;
        if (!seen[hash]) {
          seen[hash] = true;
          return true;
        }
        return false;
      });
    },

    findingsByImpactDomain() {
      return this.uniqueFindings.reduce(
        (result, finding) => {
          result[finding.finding.impactDomain].push(finding);
          return result;
        },
        { Security: [], Performance: [], Stability: [], Maintainability: [] }
      );
    },

    numSecurityFindings() {
      return this.findingsByImpactDomain.Security.length;
    },

    numPerformanceFindings() {
      return this.findingsByImpactDomain.Performance.length;
    },

    numStabilityFindings() {
      return this.findingsByImpactDomain.Stability.length;
    },

    numMaintainabilityFindings() {
      return this.findingsByImpactDomain.Maintainability.length;
    },
  },

  mounted() {
    this.sortFindingsByName();
  },
};
</script>

<style lang="scss" scoped>
.analysis-findings {
  .header-wrap {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    .header-controls {
      display: flex;
      flex-direction: row;
      gap: 1rem;
      align-items: flex-start;
      .btn {
        border: 1px solid $purps3;
        border-radius: 0.5rem;
        padding: 0.2rem 0.5rem;
        transition: $transition;
        &:hover {
          background-color: $purps3;
          color: $white;
          cursor: pointer;
        }
      }
    }
  }
  .subhead {
    font-size: 1.1rem;
    color: $gray4;
    line-height: 1.6rem;
    text-transform: uppercase;
  }
  .branch {
    font-size: 1rem;
    color: $almost-white;
    line-height: 1.6rem;
    font-weight: 500;
  }
  .findings-overview {
    h3 {
      color: $gray4;
    }
    ul {
      list-style-type: none;
      display: flex;
      flex-direction: row;
      gap: 1rem;
      justify-content: flex-start;
      padding: 0;
      li {
        border-radius: $border-radius;
        background-color: $gray1;
        padding: 0.25rem 1rem 0.25rem 1.5rem;
        transition: $transition;
        &:hover {
          background-color: $almost-white;
          color: $gray1;
          cursor: pointer;
        }
        &.total {
          padding: 0.25rem 1rem;
        }
        &.security {
          &::before {
            content: '\2022';
            color: #9d1616;
            font-weight: bold;
            display: inline-block;
            width: 1em;
            margin-left: -1em;
          }
        }
        &.performance {
          &::before {
            content: '\2022';
            color: #b54b0f;
            font-weight: bold;
            display: inline-block;
            width: 1em;
            margin-left: -1em;
          }
        }
        &.stability {
          &::before {
            content: '\2022';
            color: #d6993f;
            font-weight: bold;
            display: inline-block;
            width: 1em;
            margin-left: -1em;
          }
        }
        &.maintainability {
          &::before {
            content: '\2022';
            color: #69ad34;
            font-weight: bold;
            display: inline-block;
            width: 1em;
            margin-left: -1em;
          }
        }
      }
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
    .list {
      display: flex;
      flex-direction: column;
      align-content: center;
      li {
        border-bottom: 1px solid lighten($gray2, 15);
      }
    }
    .item {
      display: flex;
      flex-direction: row;
      li {
        border-bottom: 0;
        &:first-of-type {
          border-top: 0;
        }
        &.finding-name {
        }
        &:hover {
          cursor: pointer;
        }
      }
      &.header {
        font-weight: 800;
        color: $gray4;
        li {
          padding-bottom: 0;
        }
      }
    }
  }
}

.b-0 {
  border: none;
}

@media (min-width: 1000px) {
}

@media (max-width: 1000px) {
}
</style>
