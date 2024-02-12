<template>
  <div class="match-instructions" data-cy="match-instructions">
    <div class="content">
      <div class="content__header">
        <p>{{ appmapStats.numAppMaps }} AppMaps available</p>
        <div class="divider">|</div>
        <v-button
          data-cy="create-more-appmaps-btn"
          class="create-more-appmaps"
          size="small"
          kind="ghost"
          @click.native="openRecordInstructions"
        >
          Create more
        </v-button>
      </div>
      <p>
        <strong>{{ searchResponse.results.length }} relevant AppMaps</strong> have been selected to
        help answer your question.
      </p>
    </div>
  </div>
</template>

<script>
import VButton from '@/components/Button.vue';

export default {
  name: 'v-instructions',

  components: {
    VButton,
  },

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

  methods: {
    openRecordInstructions() {
      this.$root.$emit('open-record-instructions');
    },
  },
};
</script>

<style lang="scss" scoped>
.match-instructions {
  font-size: 0.9rem;
  color: lighten($gray4, 20%);

  .content {
    &__header {
      display: flex;
      align-items: center;

      .divider {
        margin: 0 0.75rem;
      }
    }
  }
}
</style>
