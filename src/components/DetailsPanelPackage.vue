<template>
  <div>
    <v-details-panel-header object-type="Package" :title="objectDescriptor.name" />
    <v-details-panel-list title="Classes" :items="classes"/>
    <v-details-panel-list title="Inbound connections" :items="inboundConnections"/>
    <v-details-panel-list title="Outbound connections" :items="outboundConnections"/>
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-package',
  props: {
    objectDescriptor: {
      type: Object,
      required: true,
    },
  },

  components: {
    VDetailsPanelList,
    VDetailsPanelHeader,
  },

  computed: {
    classes() {
      const packageName = this.objectDescriptor.id;
      const classIds = new Set(this.$store.state.appMap.events
        .filter((e) => e.codeObject && e.codeObject.packageOf === packageName)
        .map((e) => e.codeObject.classOf));

      return Array.from(classIds).map((classId) => ({
        kind: 'class',
        text: classId,
        object: this.$store.state.appMap.classMap.search(classId)[0],
      }));
    },

    events() {
      return this.$store.state.appMap.events
        .filter((e) => e.codeObject && e.codeObject.parent.parent === this.objectDescriptor);
    },

    inboundConnections() {
      const parentObjects = this.events
        .map((e) => (e.parent ? e.parent.codeObject : null))
        .filter(Boolean)
        .map((obj) => obj.parent.parent)
        .filter((obj) => obj !== this.objectDescriptor);

      return [...new Set(parentObjects)]
        .map((obj) => ({
          kind: 'package',
          text: obj.id,
          object: obj,
        }));
    },

    outboundConnections() {
      const childrenObjects = this.events
        .map((e) => e.children)
        .flat()
        .filter(Boolean)
        .map((e) => e.codeObject)
        .filter(Boolean)
        .map((obj) => obj.parent.parent)
        .filter((obj) => obj !== this.objectDescriptor);

      return [...new Set(childrenObjects)]
        .map((obj) => ({
          kind: 'package',
          text: obj.id,
          object: obj,
        }));
    },
  },
};
</script>

<style scoped lang="scss">
</style>
