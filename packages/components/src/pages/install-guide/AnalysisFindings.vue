<template>
  <v-quickstart-layout>
    <section class="analysis-findings">
      <div class="header-wrap">
        <header>
          <h4 class="subhead">Summary</h4>
          <h1 data-cy="title">Runtime Analysis</h1>
          <h4 class="branch">Branch: feature-update-22</h4>
        </header>
        <div class="header-controls">
          <div class="btn">Open the <strong>Problems tab</strong></div>
          <div class="btn">Share</div>
        </div>
      </div>

      <main>
        <div class="findings-wrap">
          <div class="findings-overview">
            <h3>Finding Overview</h3>
            <ul>
              <li class="total">Total: 13</li>
              <li class="security">Security: 1</li>
              <li class="performance">Performance: 4</li>
              <li class="stability">Stability: 3</li>
              <li class="maintainability">Maintainability: 6</li>
            </ul>
          </div>

          <div class="sort-wrap">
            <div class="findings-sort">
              <label for="findings-sort">Sort findings by:</label>
              <select name="sort-type" id="select-sorting">
                <option value="rule">Rule</option>
                <option value="category">Category</option>
              </select>
            </div>
            <div class="findings-action">
              <label for="select-status">Action:</label>
              <select name="action-type" id="finding-action">
                <option value="new">New</option>
                <option value="deferred">Deferred</option>
                <option value="ignored">Ignored</option>
              </select>
            </div>
          </div>

          <div class="findings-list">
            <ul class="list">
              <li>
                <ul class="item header">
                  <li class="finding-name"><h3>Finding Name</h3></li>
                  <li><h3>Status</h3></li>
                  <li><h3>Reference</h3></li>
                  <li><h3>Category</h3></li>
                </ul>
              </li>
              <li>
                <ul class="item">
                  <li class="finding-name">Query From Invalid Package</li>
                  <li>New</li>
                  <li>CWE-401</li>
                  <li>Maintainability</li>
                </ul>
              </li>
              <li>
                <ul class="item">
                  <li class="finding-name">Query From Invalid Package</li>
                  <li>New</li>
                  <li>CWE-401</li>
                  <li>Maintainability</li>
                </ul>
              </li>
              <li>
                <ul class="item">
                  <li class="finding-name">Query From Invalid Package</li>
                  <li>New</li>
                  <li>CWE-401</li>
                  <li>Maintainability</li>
                </ul>
              </li>
              <li>
                <ul class="item">
                  <li class="finding-name">Query From Invalid Package</li>
                  <li>New</li>
                  <li>CWE-401</li>
                  <li>Maintainability</li>
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
import Navigation from '@/components/mixins/navigation';

export default {
  name: 'AnalysisFindings',

  components: {
    VQuickstartLayout,
  },

  mixins: [Navigation],

  props: {
    scanned: Boolean,
    numFindings: Number,
    projectPath: String,
    findingsDomainCounts: {
      type: Object,
      default: () => ({
        security: 0,
        performance: 0,
        reliability: 0,
        maintainability: 0,
      }),
    },
    findingsEnabled: Boolean,
    analysisEnabled: Boolean,
    userAuthenticated: Boolean,
  },

  methods: {
    viewProblems() {
      this.$root.$emit('view-problems', this.projectPath);
    },
  },

  computed: {
    enableButtonLabel() {
      if (!this.userAuthenticated) return 'Sign in to enable AppMap Runtime Analysis';
      return 'Enable AppMap Runtime Analysis';
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

  .sort-wrap {
    display: flex;
    flex-direction: row;
    gap: 2rem;
    margin-top: 2rem;
    select {
      border-radius: 6px;
      border: 1px solid $purps3;
      background-color: transparent;
      color: $white;
      padding: 0.2rem 0.4rem;
      margin-left: 0.35rem;
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
