<template>
  <div>
    <v-details-panel-header object-type="SQL query" :title="title" />
    <v-details-panel-list title="Events" :items="object.events" :event-quickview="true" />
  </div>
</template>

<script>
import { getSqlLabelFromString } from '@appland/models';
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';
import { mapActions } from 'vuex';

export default {
  name: 'v-details-panel-query',
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
    ...mapActions(['selectObject', 'popSelectionStack']),
    title() {
      return getSqlLabelFromString(this.object.name);
    },

    events() {
      return this.$store.state.appMap.events.filter(
        (e) => e.isCall() && e.codeObject && e.codeObject.id === this.object.id
      );
    },
  },

  created() {
    if (this.object.events.length === 1) {
      this.popSelectionStack();
      this.selectObject(this.object.events[0]);
    }
  },
};
</script>

<style scoped lang="scss"></style>
