<template>
  <div class="details-panel-edge">
    edge
  </div>
</template>

<script>
// import DetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-edge',
  components: {
    // DetailsPanelList,
  },
  props: {
    objectDescriptor: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped lang="scss">
.details-edge {
}
</style>
