<template>
  <div class="details-panel-database">
    <div class="details-panel-header">
      <h4 class="details-type">Database</h4>
      <!-- <h4>{{name}}</h4> -->
    </div>

    <v-details-panel-list title="Queries" :items="queries" />
  </div>
</template>

<script>
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-database',
  components: {
    VDetailsPanelList,
  },
  computed: {
    queries() {
      return this.$store.state.appMap.events
        .filter((e) => e.isCall() && e.sql)
        .map((e) => ({
          kind: 'event',
          text: e.sql.sql,
          object: e,
        }));
    },
  },
};
</script>

<style scoped lang="scss">
.details-database {
}
</style>
