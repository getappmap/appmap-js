<template>
  <span class="inline-recommendation" data-cy="inline-recommendation" v-if="prompt">
    <v-popper class="inline-recommendation__popper" placement="top" align="left">
      <a href="#" @click.prevent.stop="onClick"><small>[APPMAP]</small></a>
      <template #content>
        <div class="inline-recommendation-content">
          <p data-cy="reasoning" v-if="reasoning">{{ formattedReasoning }}</p>
          <p>Click here to create a recording of this behavior.</p>
        </div>
      </template>
    </v-popper>
  </span>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import VPopper from '@/components/Popper.vue';

export default Vue.extend({
  components: { VPopper },
  props: {
    reasoning: {
      type: String as PropType<string | undefined>,
    },
    prompt: {
      type: String as PropType<string | undefined>,
    },
  },
  computed: {
    formattedReasoning(): string | undefined {
      if (!this.reasoning) return;

      // End the reasoning with a period if needed
      const lastChar = this.reasoning[this.reasoning.length - 1];
      if (lastChar.match(/\w/)) {
        return `${this.reasoning}.`;
      }

      return this.reasoning;
    },
  },
  methods: {
    onClick() {
      if (this.prompt) {
        this.$root.$emit('inline-recommendation', { prompt: this.prompt });
      }
    },
  },
});
</script>

<style scoped lang="scss">
.inline-recommendation {
  font-size: 0.8em;
  vertical-align: super;
  margin-left: 0.25em;
  font-weight: bold;

  &__popper {
    display: inline;

    &::v-deep {
      .popper__text {
        transform: translateY(calc(-100% - 6px));
        background-color: $color-background;
        color: $color-foreground;
        border-color: $color-border;
        filter: drop-shadow(0 0 0.5em rgba(black, 0.5));
        &::before {
          background-color: $color-background;
          transform: translate(0.5em, 0.5em) rotateZ(45deg);
          border-color: $color-border;
        }
      }
    }
  }
}
</style>
