<template>
  <div>
    <v-details-panel-header object-type="Function" :title="object.name">
      <template v-slot:links>
        <a href="#" @click.prevent="viewSource">View source</a>
      </template>
    </v-details-panel-header>
    <v-details-panel-list title="Events" :items="object.events" />
    <v-details-panel-list
      title="Inbound Calls"
      :items="object.inboundConnections"
    />
    <v-details-panel-list title="Outbound Calls" :items="outboundCalls" />
    <v-details-panel-list title="Queries" :items="queryEvents" />
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';
import { CodeObjectType } from '@/lib/models/codeObject';

export default {
  name: 'v-details-panel-function',
  components: {
    VDetailsPanelList,
    VDetailsPanelHeader,
  },
  props: {
    object: {
      type: Object,
      required: true,
    },
  },
  computed: {
    events() {
      return this.$store.state.appMap.events.filter(
        (e) => e.isCall() && e.codeObject && e.codeObject.id === this.object.id,
      );
    },

    eventObjects() {
      return this.events.map((e) => ({
        kind: 'event',
        text: e.codeObject.id,
        object: e,
      }));
    },

    outboundCalls() {
      return this.object.outboundConnections.filter(
        (obj) => obj.type !== CodeObjectType.QUERY,
      );
    },

    queryEvents() {
      return this.object.sqlQueries.map((obj) => obj.events).flat();
    },
  },

  methods: {
    viewSource() {
      this.$root.$emit('viewSource', this.object.location);
    },
  },
};
</script>

<style scoped lang="scss"></style>
