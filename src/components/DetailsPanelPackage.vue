<template>
  <div class="details-panel-package">
    <v-details-panel-list title="Classes" :items="classes"/>
    <v-details-panel-list title="Inbound connections" :items="inboundConnections"/>
    <v-details-panel-list title="Outbound connections" :items="outboundConnections"/>
  </div>
</template>

<script>
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-null',
  props: {
    objectDescriptor: {
      type: Object,
      required: true,
    },
  },

  components: {
    VDetailsPanelList,
  },

  computed: {
    classes() {
      const packageName = this.objectDescriptor.id;
      const classIds = new Set(this.$store.state.appMap.events
        .filter((e) => e.codeObject && e.codeObject.packageOf === packageName)
        .map((e) => e.codeObject.classOf));

      return Array.from(classIds).map((classId) => ({
        text: classId,
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
          text: obj.id,
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
          text: obj.id,
        }));
    },
  },
};
</script>

<style scoped lang="scss">
.details-package {
}
</style>
