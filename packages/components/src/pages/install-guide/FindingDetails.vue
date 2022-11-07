<template>
  <v-quickstart-layout>
    <section class="finding-details">
      <div class="header-wrap">
        <header>
          <h4 class="subhead">Finding</h4>
          <h1 data-cy="title">N Plus One Query</h1>
          <p>Find occurrences of a query being repeated within a loop.</p>
          <p>This SQL query is executed 16 times total in this request.</p>
        </header>
        <div class="header-controls">
          <!-- <div class="btn">Status: <strong>New</strong></div> -->
          <div class="findings-sort">
            <label for="findings-sort">Sort findings by:</label>
            <select name="sort-type" id="select-sorting">
              <option value="rule">Rule</option>
              <option value="category">Category</option>
            </select>
          </div>
          <div class="btn">Share</div>
        </div>
      </div>

      <main>
        <div class="finding-details-wrap row">
          <div class="findings-overview">
            <h3>Finding Overview</h3>
            <ul class="card stack">
              <li>Time: 2022-05-19 22:35:49 UTC</li>
              <li>Status: New</li>
              <li>Category: Maintenance</li>
              <li>References: <a href="/">CWE-1503</a></li>
              <li>Commit: <a href="/">1ea201b</a></li>
            </ul>
          </div>
          <div class="event-summary">
            <h3>Event Summary</h3>
            <ul class="card stack">
              <li>Database type: sqlite</li>
              <li>Server version: 3.11.0</li>
              <li>
                Message:
                <span class="code"
                  >SELECT “users”. * FROM “users” WHERE “users” . “id” = ? LIMIT ?</span
                >
              </li>
            </ul>
          </div>
        </div>
        <div class="stack-trace finding-details-wrap col">
          <h3>Stack Trace</h3>
          <ul class="card">
            <li>
              <a href="/"
                >vendor/bundle/ruby/2.7.0/gems/active-record-6.0.4.1/lib/active_record/relation.rb:249</a
              >
            </li>
            <li>
              <a href="/"
                >vendor/bundle/ruby/2.7.0/bundler/gems/appmap-ruby-g697698488fhfn/lib/appmap/hook/method.rb:89</a
              >
            </li>
            <li>
              <a href="/">app/views/shared/_feed.html.erb</a>
            </li>
            <li>
              <a href="/">app/views/static_pages/home.html.erb</a>
            </li>
            <li>
              <a href="/"
                >vendor/bundle/ruby/2.7.0/gems/actionpack-6.0.4.1/lib/action_controller/metal/instrumentation.rb:19</a
              >
            </li>
          </ul>
        </div>
      </main>
    </section>
    <div class="analysis-findings full-width">
      <h3>
        <VAppmapPin />
        Found in 3 AppMaps
      </h3>
      <ul class="appmap-list">
        <li>
          <a href="/">Microposts_interface micropost interface <span>(30 occurrences)</span></a>
        </li>
        <li>
          <a href="/">Feed_interface micropost delete <span>(5 occurrences)</span></a>
        </li>
        <li>
          <a href="/">User_account new password_reset <span>(104 occurrences)</span></a>
        </li>
      </ul>
    </div>
  </v-quickstart-layout>
</template>

<script>
import VQuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import Navigation from '@/components/mixins/navigation';
import VAppmapPin from '@/assets/appmap-pin.svg';

export default {
  name: 'FindingDetails',

  components: {
    VQuickstartLayout,
    VAppmapPin,
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
.analysis-findings.full-width {
  margin: 0 -1.75rem;
  h3 {
    padding: 0 2rem;
  }
  .appmap-list {
    padding: 0;
    border-top: 1px solid lighten($gray2, 15);
    li {
      padding: 0.5rem 2rem;
      border-bottom: 1px solid lighten($gray2, 15);
      a {
        color: $white;
      }
      &:hover {
        background-color: darken($gray2, 05);
      }
    }
  }
}
.finding-details {
  .header-wrap {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    header {
      width: 70%;
    }
    .header-controls {
      display: flex;
      flex-direction: row;
      gap: 1rem;
      align-items: flex-start;
      justify-content: flex-end;
      width: 100%;
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
    gap: 2rem;
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
    }
    .code {
      font-weight: 800;
      color: $gray4;
    }
    .card {
      border-radius: 0.5rem;
      background-color: $gray1;
      padding: 0.25rem 0;
      gap: 0;
      li {
        border-bottom: 1px solid $gray2;
        border-radius: 0;
        width: 100%;
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

@media (min-width: 1000px) {
}

@media (max-width: 1000px) {
}
</style>
