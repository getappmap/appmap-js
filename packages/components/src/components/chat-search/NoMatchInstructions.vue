<template>
  <div class="instructions" data-cy="no-match-instructions">
    <div>
      <h2>No relevant AppMaps found</h2>
      <div class="content">
        <p>
          Of the <strong>{{ numAppMaps }}</strong> AppMaps available in your project,
          <strong>None</strong> of them seem to be relevant enough to your question.
        </p>
        <p>
          The best way to improve your search results is to
          <a href="#" @click.prevent="openRecordInstructions">record more AppMaps</a> that are
          relevant to the question you want to ask.
        </p>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'v-no-match-instructions',

  props: {
    appmapStats: {
      type: Array,
      required: false,
    },
  },

  computed: {
    numAppMaps() {
      return (this.appmapStats || []).reduce((acc, { numAppMaps }) => acc + numAppMaps, 0);
    },
  },

  methods: {
    openRecordInstructions() {
      this.$root.$emit('open-record-instructions');
    },
  },
};
</script>
<style lang="scss" scoped>
.instructions {
  font-size: 0.9rem;
  color: $gray4;
  padding: 2rem;

  h2 {
    margin-top: 0;
    color: $white;
  }

  a {
    text-decoration: none;
    color: $lightblue;

    &:hover {
      color: $blue;
      transition: $transition;
      cursor: pointer;
    }
  }
}
</style>
