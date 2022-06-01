<template>
  <v-quickstart-layout>
    <section>
      <header>
        <h1>Analyze your code</h1>
      </header>
      <main>
        <article>
          <div class="center fit">
            <v-code-snippet
              :clipboard-text="command"
              :message-success="messageSuccess"
            />
          </div>
        </article>
      </main>
      <v-navigation-buttons :first="first" :last="last" />
    </section>
  </v-quickstart-layout>
</template>

<script>
import VNavigationButtons from '@/components/install-guide/NavigationButtons.vue';
import VQuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import VCodeSnippet from '@/components/CodeSnippet.vue';
import Navigation from '@/components/mixins/navigation';

export default {
  name: 'Analyze',

  components: {
    VQuickstartLayout,
    VNavigationButtons,
    VCodeSnippet,
  },

  mixins: [Navigation],

  computed: {
    command() {
      return [
        'npx @appland/appmap scan',
        this.appMapsDir && `-d ${this.appMapsDir}`,
      ]
        .filter(Boolean)
        .join(' ');
    },
  },

  props: {
    appMapsDir: String,
    messageSuccess: {
      type: String,
      default: '<b>Copied!</b><br/>Paste this command<br/>into your terminal.',
    },
  },
};
</script>
