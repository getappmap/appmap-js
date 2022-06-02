<template>
  <v-quickstart-layout>
    <section>
      <header>
        <h1 class="qs-title">Open AppMaps</h1>
      </header>
      <main>
        <article class="qs-step__block" v-if="appMaps.length">
          <p>You have AppMaps in this project!</p>
          <p>
            Here are some that look interesting that you may want to check
            out...
          </p>
          <table class="qs-appmaps-table">
            <colgroup>
              <col width="70%" />
              <col width="10%" />
              <col width="10%" />
              <col width="10%" />
            </colgroup>
            <thead>
              <tr>
                <th>AppMap</th>
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
              >
                <td>{{ appMap.name }}</td>
                <td>{{ appMap.requests }}</td>
                <td>{{ appMap.sqlQueries }}</td>
                <td>{{ appMap.functions }}</td>
              </tr>
            </tbody>
          </table>
        </article>
        <article v-else>
          No AppMaps have been found in your project. Try
          <a
            href="#"
            @click.prevent="$root.$emit('open-instruction', 'record-appmaps')"
          >
            recording AppMaps
          </a>
          first.
        </article>
      </main>
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
    appMaps: Array,
    default: () => [],
  },

  methods: {
    openAppmap(path) {
      this.$root.$emit('openAppmap', path);
    },
  },
};
</script>
