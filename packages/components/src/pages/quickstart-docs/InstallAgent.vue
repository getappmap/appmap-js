<template>
  <QuickstartLayout>
    <div class="qs-welcome">
      <div class="qs-welcome__congrats">
        🥳 Congrats! You’ve installed the AppMap extension.
        <b>Now, let’s get you some AppMaps.</b>
      </div>
    </div>
    <section class="qs-step" style="padding-top: 0">
      <h1 class="qs-headline__1">Quickstart</h1>
      <h6 class="qs-headline__subhead">INSTALL APPMAP AGENT</h6>
      <div class="qs-step__block">
        <p class="qs-step__margin">
          AppMap watches your code as it executes and generates traces you can
          examine visually to understand exactly how it works.
        </p>
        <p class="qs-step__margin">
          To do that you first need to hook a special AppMap agent in your code
          and then run it normally, executing test cases or recording a live
          interactive session of a web service.
        </p>
        <p class="qs-step__margin qs-step__callout__primary">
          <span class="callout-text">
            Run this command in the <b>root directory</b> of your project:
          </span>
          <v-code-snippet
            :clipboardText="codeSnippet"
            :messageSuccess="messageSuccess"
          ></v-code-snippet>
          <span class="callout-text__right">
            If you can’t run a Node.js based installer
            <a href="https://appland.com/docs/quickstart/vscode/manual-step-2"
              >visit our docs</a
            >
            for options.
          </span>
        </p>

        <p class="qs-step__next-step">
          Next up:
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
