<template>
  <v-quickstart-layout>
    <section>
      <header>
        <h1>Collaboration</h1>
      </header>
      <v-navigation-buttons :last="true" />
    </section>
  </v-quickstart-layout>
</template>

<script>
import VNavigationButtons from '@/components/install-guide/NavigationButtons.vue';
import VQuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';

export default {
  name: 'Collaboration',

  components: {
    VQuickstartLayout,
    VNavigationButtons,
  },
};
</script>
