<template>
  <v-tab-content>
    <template v-for="(command, index) in commands" v-slot:[command.name]>
      <v-code-snippet :key="index" :clipboard-text="command.command" />
    </template>
  </v-tab-content>
</template>

<script lang="ts">
import Vue from 'vue';
import VTabContent from '@/components/install-guide/TabbedContent.vue';
import VCodeSnippet from '@/components/CodeSnippet.vue';

interface CommandTab {
  name: string;
  command: string;
}

export default Vue.extend({
  components: {
    VTabContent,
    VCodeSnippet,
  },
  props: {
    commands: {
      type: Array as () => CommandTab[],
      default: () => [],
    },
  },
  data() {
    return {
      selectedTab: 0,
    };
  },
});
</script>

<style scoped lang="scss"></style>
