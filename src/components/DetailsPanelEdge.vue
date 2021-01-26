<template>
  <div class="details-panel-edge">
    <v-details-panel-header object-type="Edge" :title="title" />
    <v-details-panel-list title="Events" :items="events" />
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-edge',
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
      return `${this.object.from.name} to ${this.object.to.name}`;
    },

    events() {
      const { from, to } = this.object;

      return from.allEvents
        .map((e) => e.children)
        .flat()
        .filter((e) => e.codeObject.ancestors().includes(to));
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel-edge {
  padding: 0;
  h5 {
    color: lighten($gray4, 15);
    font-size: 1.1rem;
    font-weight: 500;
    line-height: 1.2;
    padding: 0 2rem;
    margin: 0 0 0.25rem 0;
  }
}
</style>
