<template>
  <div class="recording-method recording-method--disabled">
    <h3>
      <i class="header-icon header-icon--disabled"><TestsIcon /></i>Tests recording
    </h3>
    <p>
      Did you know? If you use a test framework such as {{ this.frameworks }}, you can make AppMaps
      of all your test cases. Tests weren't detected in this project, though.
    </p>
  </div>
</template>
<script>
import TestsIcon from '@/assets/tests-icon.svg';

export default {
  name: 'TestsPrompt',

  props: {
    frameworks: Array,
  },
  components: { TestsIcon },
};
</script>
