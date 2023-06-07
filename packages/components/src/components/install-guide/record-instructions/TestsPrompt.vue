<template>
  <div style="color: #999">
    <h3>Tests recording</h3>

    Did you know? If you use a test framework such as {{ this.frameworks }}, you can make AppMaps of
    all your test cases. Tests weren't detected in this project, though.
  </div>
</template>
<script>
export default {
  name: 'TestsPrompt',

  props: {
    frameworks: Array,
  },
};
</script>
