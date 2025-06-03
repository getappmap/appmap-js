<template>
  <v-modal-container @close="$emit('close')">
    <div class="dismiss-modal">
      <h3 class="dismiss-modal__title">{{ title }}</h3>
      <label for="dismiss-reason" class="dismiss-modal__label">
        {{ subtitle }}
      </label>
      <textarea
        v-model="dismissReasonInput"
        id="dismiss-reason"
        class="dismiss-modal__textarea"
        ref="input"
        :placeholder="placeholder"
      >
      </textarea>
      <div class="dismiss-modal__actions">
        <v-button @click.native="closeDismissDialog" kind="native-ghost">Cancel</v-button>
        <v-button @click.native="submitDismissReason" :disabled="isInputEmpty" kind="native">
          Submit
        </v-button>
      </div>
    </div>
  </v-modal-container>
</template>

<script lang="ts">
import Vue from 'vue';
import VModalContainer from '@/components/review/ModalContainer.vue';
import VButton from '@/components/Button.vue';

export default Vue.extend({
  components: {
    VModalContainer,
    VButton,
  },
  props: {
    title: {
      type: String,
      default: 'Dismiss Suggestion',
    },
    subtitle: {
      type: String,
      default: 'Reason for dismissal',
    },
    placeholder: {
      type: String,
      default: 'Enter the reason for dismissing this suggestion...',
    },
  },
  data() {
    return {
      dismissReasonInput: '',
    };
  },
  computed: {
    dismissReason(): string {
      return this.dismissReasonInput.trim();
    },
    isInputEmpty(): boolean {
      return this.dismissReason === '';
    },
  },
  methods: {
    closeDismissDialog(): void {
      this.$emit('close');
    },
    submitDismissReason(): void {
      if (!this.isInputEmpty) {
        this.$emit('submit', this.dismissReason);
        this.dismissReasonInput = '';
      }
    },
  },
  mounted() {
    const input = this.$refs.input as HTMLTextAreaElement | undefined;
    input?.focus();
  },
});
</script>

<style scoped lang="scss">
.dismiss-modal {
  padding-bottom: 2rem;
  padding-top: 1rem;
  overflow-y: auto;

  &__textarea {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    min-width: 100%;
    min-height: 8rem;
    background-color: $color-input-bg;
    color: $color-input-fg;
    border-radius: $border-radius;
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid $color-border;
    font-family: $font-family;
    font-size: $font-size;
    &:focus {
      outline: none;
      border-color: $color-highlight;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 600;
    color: $color-foreground-light;
    margin-bottom: 1rem;
  }
}
</style>
