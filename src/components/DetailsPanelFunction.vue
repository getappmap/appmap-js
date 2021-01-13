<template>
  <div>
    <v-details-panel-header object-type="Function" :title="objectDescriptor.name">
      <template v-slot:links>
        <a href="#" @click.prevent="viewSource">View source</a>
      </template>
    </v-details-panel-header>
    <v-details-panel-list title="Events" :items="eventObjects" />
    <v-details-panel-list title="Queries" :items="queries" />
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-function',
  components: {
    VDetailsPanelList,
    VDetailsPanelHeader,
  },
  props: {
    objectDescriptor: {
      type: Object,
      required: true,
    },
  },
  computed: {
    events() {
      return this.$store.state.appMap.events
        .filter((e) => e.isCall() && e.codeObject && e.codeObject.id === this.objectDescriptor.id);
    },

    eventObjects() {
      return this
        .events
        .map((e) => ({
          kind: 'event',
          text: e.codeObject.id,
          object: e,
        }));
    },

    queries() {
      return this
        .events
        .map((e) => e.children)
        .flat()
        .filter((e) => e && e.isCall() && e.sql)
        .map((e) => ({
          kind: 'event',
          text: e.sql.sql,
          object: e,
        }));
    },
  },

  methods: {
    viewSource() {
      this.$root.$emit('viewSource', this.objectDescriptor.location);
    },
  },
};
</script>

<style scoped lang="scss">
</style>
