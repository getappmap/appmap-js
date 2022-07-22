<template>
  <v-quickstart-layout>
    <section class="qs-step">
      <div class="qs-step__head">
        <h1 class="qs-title" data-cy="title">Explore AppMaps</h1>
      </div>
      <div class="qs-step__block" v-if="appMaps.length">
        <p>
          AppMaps have been recorded for this project! <br />
          We've identified some interesting AppMaps and Code Objects that you
          may want to check out.
        </p>
        <div class="qs-explore-code-objects" data-cy="code-objects">
          <h2 class="subhead">Selected Code objects</h2>
          <ul class="code-object-list">
            <div class="collapse-expand">
              <div class="accordion-toggle">
                <p>HTTP Server requests</p>
              </div>
            </div>
            <li
              v-for="httpRequest in httpRequests"
              :key="httpRequest.path"
              @click="openAppmap(httpRequest.path)"
              data-cy="httpRequest"
            >
              <a href="#">{{ httpRequest.name }}</a>
            </li>
          </ul>
          <ul class="code-object-list">
            <div class="collapse-expand">
              <div class="accordion-toggle">
                <p>Queries</p>
              </div>
            </div>
            <li
              v-for="query in queries"
              :key="query.path"
              @click="openAppmap(query.path)"
              data-cy="query"
            >
              <a href="#">{{ query.name }}</a>
            </li>
          </ul>
        </div>
        <div class="table-wrap">
          <table class="qs-appmaps-table" data-cy="appmaps">
            <colgroup>
              <col width="70%" />
              <col width="10%" />
              <col width="10%" />
              <col width="10%" />
            </colgroup>
            <thead>
              <tr>
                <th><h2 class="subhead">Selected AppMaps</h2></th>
                <th>Requests</th>
                <th>SQL</th>
                <th>Functions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="appMap in appMaps"
                :key="appMap.path"
                @click="openAppmap(appMap.path)"
                data-cy="appmap"
              >
                <td>{{ appMap.name }}</td>
                <td>{{ appMap.requests }}</td>
                <td>{{ appMap.sqlQueries }}</td>
                <td>{{ appMap.functions }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <article v-else data-cy="no-appmaps">
        No AppMaps have been found in your project. Try
        <a
          href="#"
          @click.prevent="$root.$emit('open-instruction', 'record-appmaps')"
        >
          recording AppMaps
        </a>
        first.
      </article>
    </section>
    <v-navigation-buttons :first="first" :last="last" />
  </v-quickstart-layout>
</template>

<script>
import VNavigationButtons from '@/components/install-guide/NavigationButtons.vue';
import VQuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import Navigation from '@/components/mixins/navigation';

export default {
  name: 'OpenAppMaps',

  components: {
    VQuickstartLayout,
    VNavigationButtons,
  },

  mixins: [Navigation],

  props: {
    appMaps: {
      type: Array,
      default: () => [],
    },
    sampleCodeObjects: {
      type: Object,
      default: () => ({}),
    },
  },

  computed: {
    httpRequests() {
      return this.sampleCodeObjects && this.sampleCodeObjects.httpRequests;
    },
    queries() {
      return this.sampleCodeObjects && this.sampleCodeObjects.queries;
    },
  },

  methods: {
    openAppmap(path) {
      this.$root.$emit('openAppmap', path);
    },
  },
};
</script>

<style lang="scss" scoped>
.table-wrap {
  margin-bottom: 1.5rem;
  overflow-x: auto;
  border-radius: $border-radius;
  &::-webkit-scrollbar-thumb {
    background: $gray-secondary;
  }
}
.qs-explore-code-objects {
  margin: 2rem 0;
  .code-object-list {
    .collapse-expand {
      border-bottom: 1px solid lighten($gray2, 08);
      padding: 0.4rem 0;
      .accordion-toggle {
        display: flex;
        gap: 0.5rem;
        .counter-badge {
          display: flex;
          align-items: center;
          align-content: center;
          background-color: $gray1;
          border-radius: 1rem;
          padding: 0 0.3rem;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1px;
        }
      }
    }
  }
  ul {
    list-style-type: none;
    padding: 0;
    li {
      padding: 0.2rem 0.5rem;
      border-bottom: 1px solid lighten($gray2, 08);
      &:hover {
        background-color: lighten($gray2, 08);
        cursor: pointer;
      }
    }
  }
  .subhead {
    border-bottom: 1px solid $gray-secondary;
    font-size: 1.25rem;
    padding-bottom: 0.25rem;
    font-weight: 600;
  }
}
.qs-appmaps-table {
  th {
    border-bottom: 1px solid $gray-secondary;
  }
}
.collapse-expand {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  svg {
    margin-left: 0.5rem;
  }
}
</style>
