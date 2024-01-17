<template>
  <div class="instructions" data-cy="no-match-instructions">
    <div>
      <h2>No relevant AppMaps found</h2>
      <div class="content">
        <p>
          Of the <strong>{{ appmapStats.numAppMaps }}</strong> AppMaps available in your project,
          <strong>None</strong> of them seem to be relevant enough to your question.
        </p>
        <p>
          The best way to improve your search results is to record more AppMaps that are relevant to
          the question you want to ask.
        </p>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'v-no-match-instructions',
  props: {
    appmapStats: {
      type: Object,
      required: true,
    },
  },
};
</script>
<style lang="scss" scoped>
.instructions {
  font-size: 0.9rem;
  color: $gray4;

  h2 {
    color: $white;
  }
}
</style>
