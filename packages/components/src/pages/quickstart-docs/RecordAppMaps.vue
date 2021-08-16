<template>
  <QuickstartLayout>
    <section class="qs-step">
      <div class="qs-step__head">
        <h1 class="qs-title">Record AppMaps</h1>
      </div>
      <div class="qs-step__block">
        <p>Record AppMaps using your existing tests.</p>
        <ul>
          <li>
            <a
              href="https://appland.com/docs/quickstart/vscode/ruby-step-3#rspec"
              >Record AppMaps with RSpec</a
            >
          </li>
          <li>
            <a
              href="https://appland.com/docs/quickstart/vscode/ruby-step-3#minitest"
              >Record AppMaps with Minitest</a
            >
          </li>
          <li>
            <a
              href="https://appland.com/docs/quickstart/vscode/ruby-step-3#cucumber"
              >Record AppMaps with Cucumber</a
            >
          </li>
        </ul>
        <p>
          If you do not have tests, you can use our Remote recording capability
          to record your application as it runs. This requires a Rails-based
          application.
        </p>
        <ul>
          <li>
            <a
              href="https://appland.com/docs/quickstart/vscode/ruby-step-3#remote-recording"
              >Remote recording</a
            >
          </li>
        </ul>
        <p>
          After you have installed the agent proceed to
          <a href="#" @click="goToOpenAppmaps"><b>Open AppMaps</b></a>
        </p>
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
    goToOpenAppmaps(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.$root.$emit('transition', 'OPEN_APPMAPS');
    },
  },
};
</script>
