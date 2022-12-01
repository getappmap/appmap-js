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
              <li class="total" data-cy="category-all" @click="updateFilter('all')">
                All: {{ uniqueFindings.length }}
              </li>
              <li
                v-if="numSecurityFindings"
                class="security"
                data-cy="category-security"
                @click="updateFilter('Security')"
              >
                Security: {{ numSecurityFindings }}
              </li>
              <li
                v-if="numPerformanceFindings"
                class="performance"
                data-cy="category-performance"
                @click="updateFilter('Performance')"
              >
                Performance: {{ numPerformanceFindings }}
              </li>
              <li
                v-if="numStabilityFindings"
                class="stability"
                data-cy="category-stability"
                @click="updateFilter('Stability')"
              >
                Stability: {{ numStabilityFindings }}
              </li>
              <li
                v-if="numMaintainabilityFindings"
                class="maintainability"
                data-cy="category-maintainability"
                @click="updateFilter('Maintainability')"
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
                    @click="updateSorting('name')"
                  >
                    <h3>Finding Name</h3>
                  </li>
                  <!-- TODO
                  <li><h3>Status</h3></li>
                  -->
                  <li data-cy="column-header-category" @click="updateSorting('category')">
                    <h3>Category</h3>
                  </li>
                </ul>
              </li>
              <li
                v-for="finding in sortedAndFilteredUniqueFindings"
                :key="finding.hash_v2"
                data-cy="finding"
              >
                <ul class="item" @click="openFindingInfo(finding.hash_v2)">
                  <li class="finding-name">{{ finding.ruleTitle }}</li>
                  <!-- TODO
                  <li>New</li>
                  -->
                  <li>{{ finding.impactDomain }}</li>
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
      filterBy: 'all',
    };
  },

  methods: {
    updateSorting(sortBy) {
      if (this.sortBy === sortBy) {
        this.sortAscending = !this.sortAscending;
      }

      this.sortBy = sortBy;
    },

    updateFilter(filterBy) {
      this.filterBy = filterBy;
    },

    sortFindings(findings) {
      if (this.sortBy === 'category') {
        this.sortFindingsByCategory(findings);
      } else if (this.sortBy === 'name') {
        this.sortFindingsByName(findings);
      }
    },

    sortFindingsByName(findings) {
      findings.sort((a, b) => {
        if (this.sortAscending) {
          return a.ruleTitle < b.ruleTitle ? -1 : 1;
        }
        return a.ruleTitle < b.ruleTitle ? 1 : -1;
      });
    },

    sortFindingsByCategory(findings) {
      findings.sort((a, b) => {
        if (this.sortAscending) {
          return a.impactDomain < b.impactDomain ? -1 : 1;
        }
        return a.impactDomain < b.impactDomain ? 1 : -1;
      });
    },

    filterFindings(findings) {
      if (this.filterBy === 'all') return findings;

      return findings.filter((finding) => finding.impactDomain === this.filterBy);
    },

    openFindingInfo(hash) {
      this.$root.$emit('open-finding-info', hash);
    },

    openProblemsTab() {
      this.$root.$emit('open-problems-tab');
    },
  },

  computed: {
    sortedAndFilteredUniqueFindings() {
      const { uniqueFindings } = this;
      const filteredFindings = this.filterFindings(uniqueFindings);
      this.sortFindings(filteredFindings);
      return filteredFindings;
    },

    uniqueFindings() {
      return Object.values(
        this.findings.reduce((result, { finding }) => {
          result[finding.hash_v2] = finding;
          return result;
        }, {})
      );
    },

    findingsByImpactDomain() {
      return this.uniqueFindings.reduce(
        (result, finding) => {
          result[finding.impactDomain].push(finding);
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
