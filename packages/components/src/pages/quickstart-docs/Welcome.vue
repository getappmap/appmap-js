<template>
  <QuickstartLayout>
    <section class="qs-welcome">
      <div class="qs-welcome__congrats">
        🥳 Congrats! You’ve installed the AppMap extension.
        <b>Now, let’s get you some AppMaps.</b>
      </div>
      <div class="qs-welcome__list">
        <section class="qs-welcome__item">
          <h1 class="qs-welcome__item-title">
            I would like to <b>make AppMaps of my App</b>
          </h1>
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
        <section class="qs-welcome__item">
          <h1 class="qs-welcome__item-title">
            I have an <b>AppMap file</b> and I want to open it
          </h1>
          <p>
            You have everything you need! Just add the file to a directory in
            this project, and click on it in the left hand sidebar as you
            normally would to open a file. The file will open automatically in
            the AppMap viewer.
          </p>
        </section>
        <section class="qs-welcome__item">
          <h1 class="qs-welcome__item-title">
            I received a <b>link to an AppMap</b> and I want to open it
          </h1>
          <p>
            Simply click the link you recieved, follow the prompt to log-in with
            a new or existing account, and you will be directed to the AppMap.
            You can read more about sharing AppMap files in our
            <a href="https://appland.com/docs/appmap-overview.html">docs</a>.
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
