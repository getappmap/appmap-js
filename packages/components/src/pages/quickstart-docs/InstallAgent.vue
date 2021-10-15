<template>
  <QuickstartLayout>
    <div class="qs-welcome">
      <div class="qs-welcome__congrats">
        🥳 Congrats! You’ve installed the AppMap extension.
        <b>Now, let’s get you some AppMaps.</b>
      </div>
    </div>
    <section class="qs-step" style="padding-top: 0">
      <h1>Make AppMaps</h1>
      <div class="qs-step__block">
        <p class="qs-step__margin">
          To record AppMaps you will need to install the AppMap agent for this
          project. We have provided an installer to help you do that.
        </p>
        <p class="qs-step__margin">
          Run this command in the <b>root directory</b> of your project.
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

  props: {
    codeSnippet: String,
    messageSuccess: {
      type: String,
      default:
        '<b>Copied!</b><br>Paste into your terminal<br>to run the installer',
    },
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
