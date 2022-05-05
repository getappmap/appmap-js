<template>
  <QuickstartLayout>
    <section class="qs-step">
      <div class="qs-step__head">
        <h1 class="qs-title">Open AppMaps</h1>
      </div>
      <div class="qs-step__block" v-if="appmaps.length">
        <p>You have AppMaps in this project!</p>
        <p>
          Here are some that look interesting that you may want to check out...
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
              v-for="appmap in appmaps"
              :key="appmap.path"
              @click="openAppmap(appmap.path)"
            >
              <td>{{ appmap.name }}</td>
              <td>{{ appmap.requests }}</td>
              <td>{{ appmap.sqlQueries }}</td>
              <td>{{ appmap.functions }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="qs-noappmaps">No AppMaps found in your project.</div>
    </section>
  </QuickstartLayout>
</template>

<script>
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';

export default {
  name: 'QuickstartDocsOpenAppMaps',
  components: {
    QuickstartLayout,
  },
  props: {
    appmaps: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    openAppmap(path) {
      this.$root.$emit('openAppmap', path);
    },
  },
};
</script>
