<template>
  <div>
    <v-details-panel-header
      object-type="Package"
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
import VDetailsButton from '@/components/DetailsButton.vue';
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
    VDetailsButton,
    VDetailsPanelList,
    VDetailsPanelHeader,
  },
  methods: {
    setAsRoot() {
      this.$root.$emit('makeRoot', this.object);
    },
  },
};
</script>

<style scoped lang="scss"></style>
