<template>
  <div id="component-details" class="selection-details">
    <h3>{{title}}</h3>
    <div class="content">
      <h4>{{subtitle}}</h4>

      <div class="lists">
        <details-panel-list title="Functions" />
        <details-panel-list title="Source location" />
        <details-panel-list title="HTTP server requests" />
        <details-panel-list title="SQL queries" />
      </div>
    </div>
  </div>
</template>

<script>
import DetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'details-panel',
  components: {
    DetailsPanelList,
  },
  props: {
    title: {
      type: String,
      default: 'Component details',
    },
    subtitle: String,
  },
  updated() {
    console.log('updating');
  },
};
</script>

<style scoped lang="scss">
h3 {
  font-size: 1.2rem;
  color: #e3e5e8;
  text-transform: uppercase;
  margin-bottom: 1rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #343742;
}

h4 {
  margin-bottom: 1rem;
  color: #e3e5e8;
}

.content {
  padding: 0 2rem;
}
</style>
