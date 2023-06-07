<template>
  <div style="color: #999">
    <h3>Requests recording</h3>

    Did you know? When you run a {{ this.frameworks }} app, you can make AppMaps of all the HTTP
    requests served by your app. {{ this.frameworks }} wasn't detected in this project, though.
  </div>
</template>
<script>
export default {
  name: 'WebFrameworkPrompt',

  props: {
    frameworks: Array,
  },
};
</script>
