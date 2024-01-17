<template>
  <div class="instructions" data-cy="match-instructions">
    <h2>AppMap search results</h2>
    <div class="content">
      <p>
        Of the <strong>{{ appmapStats.numAppMaps }}</strong> AppMaps available in your project,
        <strong>{{ searchResponse.results.length }}</strong> of them have been selected to help
        answer your question. <strong>Remember!</strong> The better your AppMaps match your
        question, the better Navie's answers will be.
      </p>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'v-instructions',
  props: {
    appmapStats: {
      type: Object,
      required: true,
    },
    searchResponse: {
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
    margin-bottom: 0;
    margin-top: 0;
  }

  p {
    margin: 0;
  }
}
</style>
