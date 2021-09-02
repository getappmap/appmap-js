<template>
  <QuickstartLayout>
    <section class="qs-step">
      <div class="qs-step__head">
        <h1 class="qs-title">Install the AppMap agent for this project</h1>
      </div>
      <div class="qs-step__block">
        <p>
          We have provided an installer to help you do that. All you have to do
          is open a terminal window in the root of your project and paste in
          this command:
        </p>
        <v-code-snippet
          :clipboardText="codeSnippet"
          :messageSuccess="messageSuccess"
        ></v-code-snippet>
        <p>
          After you have installed the agent proceed to
          <a href="#" @click="goToRecordAppmaps"><b>Record AppMaps</b></a>
        </p>
      </div>
    </section>
  </QuickstartLayout>
</template>

<script>
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import VCodeSnippet from '@/components/CodeSnippet.vue';

export default {
  name: 'QuickstartDocsInstallAgent',

  components: {
    QuickstartLayout,
    VCodeSnippet,
  },

  data() {
    return {
      codeSnippet: 'npx @appland/appmap install-agent',
      messageSuccess:
        '<b>Copied!</b><br>Paste into your terminal<br>to run the installer',
    };
  },

  methods: {
    goToRecordAppmaps(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.$root.$emit('transition', 'RECORD_APPMAPS');
    },
  },
};
</script>
