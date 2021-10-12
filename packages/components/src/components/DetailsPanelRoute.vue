<template>
  <div>
    <v-details-panel-header
      object-type="Route"
      :object="object"
      :title="object.name"
    >
      <template v-slot:links>
        <v-details-button @click.native="setAsRoot">
          Set as Root
        </v-details-button>
      </template>
    </v-details-panel-header>
    <v-details-panel-list
      title="Events"
      :items="object.events"
      :event-quickview="true"
    />
    <v-details-panel-list
      title="Outbound connections"
      :items="outboundConnections"
    />
    <v-details-panel-list title="Queries" :items="queryEvents" />
  </div>
</template>

<script>
import { CodeObjectType } from '@appland/models';
import VDetailsButton from '@/components/DetailsButton.vue';
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-route',
  components: {
    VDetailsButton,
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
    outboundConnections() {
      // Queries will appear in outbound connections, but we have a separate section for queries so
      // filter them out of this list
      return this.object.outboundConnections.filter(
        (obj) => obj.type !== CodeObjectType.QUERY
      );
    },
    queryEvents() {
      return this.object.sqlQueries.map((obj) => obj.events).flat();
    },
  },
  methods: {
    setAsRoot() {
      this.$root.$emit('makeRoot', this.object);
    },
  },
};
</script>

<style scoped lang="scss"></style>
