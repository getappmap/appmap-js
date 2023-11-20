<template>
  <div class="recording-method recording-method--disabled">
    <h3>
      <i class="header-icon header-icon--disabled"><TestsIcon /></i>Tests recording
    </h3>
    <br />
    <p>
      If you use a test framework such as {{ framework }}, you can make AppMaps of all your test
      cases.
    </p>
    <p>No tests were detected in this project.</p>
  </div>
</template>
<script>
import TestsIcon from '@/assets/tests-icon.svg';

export default {
  name: 'TestsPrompt',

  props: {
    framework: String,
  },
  components: { TestsIcon },
};
</script>
