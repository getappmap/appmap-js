<template>
  <div class="details-panel-package">
    <div class="details-panel-header">
      <h4 class="details-type">Package</h4>
      <!-- <h4>{{name}}</h4> -->
    </div>
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
.details-package {
}
</style>
