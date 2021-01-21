<template>
  <div>
    <v-details-panel-header object-type="Package" :title="object.name" />
    <v-details-panel-list
      title="Classes"
      :items="object.classes"
      nameKey="name"
    />
    <v-details-panel-list
      title="Inbound connections"
      :items="object.inboundConnections"
    />
    <v-details-panel-list
      title="Outbound connections"
      :items="object.outboundConnections"
    />
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-package',
  props: {
    object: {
      type: Object,
      required: true,
    },
  },

  components: {
    VDetailsPanelList,
    VDetailsPanelHeader,
  },
};
</script>

<style scoped lang="scss"></style>
