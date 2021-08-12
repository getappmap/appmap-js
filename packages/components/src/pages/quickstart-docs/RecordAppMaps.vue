<template>
  <QuickstartLayout>
    <section class="qs-step">
      <div class="qs-step__head">
        <h1 class="qs-title">Record AppMaps</h1>
      </div>
      <div class="qs-step__block">
        <p>Record AppMaps using your existing tests.</p>
        <ul>
          <li><a href="">Record AppMaps with RSpec</a></li>
          <li><a href="">Record AppMaps with Minitest</a></li>
          <li><a href="">Record AppMaps with Cucumber</a></li>
        </ul>
        <p>
          If you do not have tests, you can use our Remote recording capability
          to record your application as it runs. This requires a Rails-based
          application.
        </p>
        <ul>
          <li><a href="">Remote recording</a></li>
        </ul>
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
};
</script>
