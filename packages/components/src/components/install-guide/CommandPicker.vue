<template>
  <v-tab-content @select-tab="onSelectTab">
    <template v-for="(command, index) in commands" v-slot:[command.name]>
      <v-code-snippet :key="index" language="shell" :clipboard-text="command.command" />
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
  methods: {
    onSelectTab(tabName: string, tabIndex: number) {
      this.$emit('select-tab', tabName, tabIndex);
    },
  },
});
</script>

<style scoped lang="scss"></style>
