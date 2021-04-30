<template>
  <div>
    <v-details-panel-header object-type="SQL query" :title="title" />
    <v-details-panel-list
      title="Events"
      :items="object.events"
      :event-quickview="true"
    />
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';
import { getSqlLabelFromString } from '@appland/models';
import { SELECT_OBJECT, POP_OBJECT_STACK } from '../store/vsCode';

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
      this.$store.commit(POP_OBJECT_STACK);
      this.$store.commit(SELECT_OBJECT, this.object.events[0]);
    }
  },
};
</script>

<style scoped lang="scss"></style>
