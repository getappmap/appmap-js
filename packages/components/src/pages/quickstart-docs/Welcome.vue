<template>
  <QuickstartLayout>
    <section class="qs-welcome">
      <div class="qs-welcome__congrats">
        🥳 Congrats! You’ve installed the AppMap extension.
        <b>Now, let’s get you some AppMaps.</b>
      </div>
      <div class="qs-welcome__list">
        <section class="qs-welcome__item">
          <h1 class="qs-welcome__item-title"><b>Make AppMaps</b></h1>
          <p>
            To record AppMaps you will need to install the AppMap agent for this
            project.
          </p>
          <p>
            <a href="#" @click="goToInstallAgent"
              ><b>Install AppMap Agent</b></a
            >
          </p>
        </section>
      </div>
    </section>
  </QuickstartLayout>
</template>

<script>
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';

export default {
  name: 'QuickstartDocsRecordAppMaps',

  components: {
    QuickstartLayout,
  },

  methods: {
    goToInstallAgent(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.$root.$emit('transition', 'INSTALL_AGENT');
    },
  },
};
</script>
