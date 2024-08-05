<template>
  <div class="button-group">
    <div class="button-group__label">{{ label }}</div>
    <div class="button-group__buttons">
      <v-button
        v-for="button in buttons"
        :key="button"
        :class="{ button: 1, 'button--active': selectedButton === button }"
        size="small"
        @click.native="onClickButton(button)"
      >
        {{ button }}
      </v-button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VButton from '@/components/Button.vue';

export default Vue.extend({
  components: {
    VButton,
  },
  props: {
    label: {
      type: String,
    },
    buttons: {
      type: Array as () => string[],
      default: () => [],
    },
  },
  data() {
    return {
      selectedButton: undefined as undefined | string,
    };
  },
  methods: {
    onClickButton(button: string) {
      const newSelection = this.selectedButton === button ? undefined : button;
      this.selectedButton = newSelection;
      this.$emit('click', newSelection);
    },
  },
});
</script>

<style scoped lang="scss">
.button-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &__label {
    font-size: 0.75rem;
    color: $gray5;
  }

  &__buttons {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;

    .button {
      background-color: $gray2;
      border-color: lighten($gray2, 5%);
      color: $gray5;

      &:hover {
        border-color: lighten($gray2, 25%);
        background: lighten($gray2, 5%);
      }

      &--active {
        border-color: $brightblue;
        background-color: lighten($gray2, 10%);
        color: $brightblue;
        // box-shadow: inset 0.1rem 0.1rem 0.2rem 0.2rem rgba(black, 0.51);

        &:hover {
          border-color: lighten($brightblue, 15%);
          background-color: lighten($gray2, 10%);
        }
      }
    }
  }
}
</style>
