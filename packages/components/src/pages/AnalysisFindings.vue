<template>
  <v-quickstart-layout>
    <section class="analysis-findings">
      <div class="header-wrap">
        <header>
          <h4 class="subhead">Overview</h4>
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
            <h3>Finding Impact Categories</h3>
            <ul>
              <li class="total" data-cy="category-all" @click="updateFilter('all')">
                All: {{ uniqueFindings.length }}
              </li>
              <li
                v-if="numSecurityFindings"
                class="security"
                data-cy="category-security"
                @click="updateFilter('security')"
              >
                Security: {{ numSecurityFindings }}
              </li>
              <li
                v-if="numPerformanceFindings"
                class="performance"
                data-cy="category-performance"
                @click="updateFilter('performance')"
              >
                Performance: {{ numPerformanceFindings }}
              </li>
              <li
                v-if="numStabilityFindings"
                class="stability"
                data-cy="category-stability"
                @click="updateFilter('stability')"
              >
                Stability: {{ numStabilityFindings }}
              </li>
              <li
                v-if="numMaintainabilityFindings"
                class="maintainability"
                data-cy="category-maintainability"
                @click="updateFilter('maintainability')"
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
                  <li class="finding-name">
                    <h3 class="mobile-heading">Finding Name:</h3>
                    {{ finding.ruleTitle }}
                  </li>
                  <li class="finding-category">
                    <h3 class="mobile-heading">Category:</h3>
                    {{ finding.impactDomain }}
                  </li>
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

      return findings.filter((finding) => {
        const impactDomain = finding.impactDomain && finding.impactDomain.toLowerCase();
        return impactDomain === this.filterBy;
      });
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
          const impactDomain =
            (finding.impactDomain && finding.impactDomain.toLowerCase()) || 'unknown';
          result[impactDomain].push(finding);
          return result;
        },
        { security: [], performance: [], stability: [], maintainability: [], unknown: [] }
      );
    },

    numSecurityFindings() {
      return this.findingsByImpactDomain.security.length;
    },

    numPerformanceFindings() {
      return this.findingsByImpactDomain.performance.length;
    },

    numStabilityFindings() {
      return this.findingsByImpactDomain.stability.length;
    },

    numMaintainabilityFindings() {
      return this.findingsByImpactDomain.maintainability.length;
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
        border: 1px solid $white;
        border-radius: 0.5rem;
        padding: 0.25rem 1rem;
        transition: $transition;
        &:hover {
          background-color: $gray1;
          border-color: $gray1;
          color: $white;
          cursor: pointer;
        }
      }
    }
  }
  .mobile-heading {
    display: none;
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
        padding: 0.25rem 1.35rem 0.25rem 2rem;
        transition: $transition;
        display: flex;
        align-items: center;
        &:hover {
          background-color: $almost-white;
          color: $gray1;
          cursor: pointer;
        }
        &:before {
          font-size: 20px;
          line-height: 20px;
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

@media (max-width: 800px) {
  .analysis-findings {
    .header-wrap {
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
      header {
        margin-bottom: 0;
      }
    }
    .findings-list {
      .item {
        flex-direction: column;
      }
    }
    .findings-overview {
      ul {
        flex-direction: column;
        gap: 0.35rem;
        width: 100%;
      }
    }
    .findings-list .list {
      li {
        padding-top: 0.25rem;
        padding-bottom: 0.2rem;
      }
    }
    .item.header {
      display: none;
    }
    .mobile-heading {
      color: $gray4;
      display: unset;
      margin-right: 0.35rem;
    }
  }
}
</style>
