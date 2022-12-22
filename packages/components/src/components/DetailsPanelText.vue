<template>
  <div class="details-panel-text">
    <v-details-panel-list-header>{{ title }}</v-details-panel-list-header>
    <p><slot /></p>
  </div>
</template>

<script>
import VDetailsPanelListHeader from '@/components/DetailsPanelListHeader.vue';
export default {
  name: 'v-details-panel-text',
  components: { VDetailsPanelListHeader },
  props: { title: String },
};
</script>

<style lang="scss">
.details-panel-text {
  p {
    padding: 0 0.5rem;
  }
}
</style>
