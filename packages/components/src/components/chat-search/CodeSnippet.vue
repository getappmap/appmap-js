<template>
  <div class="code-snippet">
    <h3>Explaining code snippet:</h3>
    <div class="code">
      <pre>
        {{ code }}
      </pre>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'v-code-snippet',
  props: {
    code: {
      type: String,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.code-snippet {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: $gray1;
  border-radius: 0.25rem;

  color: $gray4;

  h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .code {
    width: 100%;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.8rem;
  }
}
</style>
