<template>
  <div class="details-panel-database">
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
