<template>
  <div>
    <v-details-panel-header object-type="Database">
      <template v-slot:links>
        <v-details-button @click.native="setAsRoot">
          Set as Root
        </v-details-button>
      </template>
    </v-details-panel-header>
    <v-details-panel-list
      title="Inbound connections"
      :items="object.inboundConnections"
    />
    <v-details-panel-list title="Queries" :items="queryEvents" />
  </div>
</template>

<script>
import VDetailsButton from '@/components/DetailsButton.vue';
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-database',
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
    queryEvents() {
      return this.object.children.map((obj) => obj.events).flat();
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
