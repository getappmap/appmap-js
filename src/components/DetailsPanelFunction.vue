<template>
  <div class="details-panel-function">
    function
  </div>
</template>

<script>
// import DetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-function',
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
.details-function {
}
</style>
