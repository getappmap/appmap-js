<template>
  <div>
    <v-details-panel-header
      object-type="Function"
      :object="object"
      :title="object.name"
    />
    <v-details-panel-filters :object="object" :is-root-object="isRootObject" />
    <v-details-panel-list
      title="Events"
      :items="object.events"
      :event-quickview="true"
    />
    <v-details-panel-list
      title="Inbound Calls"
      :items="object.inboundConnections"
    />
    <v-details-panel-list title="Outbound Calls" :items="outboundCalls" />
    <v-details-panel-list title="Queries" :items="queryEvents" />
  </div>
</template>

<script>
import { CodeObjectType } from '@appland/models';
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelFilters from '@/components/DetailsPanelFilters.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-function',
  components: {
    VDetailsPanelList,
    VDetailsPanelFilters,
    VDetailsPanelHeader,
  },
  props: {
    object: {
      type: Object,
      required: true,
    },
    isRootObject: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  computed: {
    events() {
      return this.$store.state.appMap.events.filter(
        (e) => e.isCall() && e.codeObject && e.codeObject.id === this.object.id
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
        (obj) => obj.type !== CodeObjectType.QUERY
      );
    },

    queryEvents() {
      return this.object.sqlQueries.map((obj) => obj.events).flat();
    },
  },
};
</script>

<style scoped lang="scss"></style>
