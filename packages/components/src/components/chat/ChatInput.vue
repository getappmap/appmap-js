<template>
  <div class="chat-input">
    <div
      v-if="codeSelections && codeSelections.length"
      class="attachments"
      data-cy="input-attachments"
    >
      <!-- <div>Including code snippet</div> -->
      <v-code-selection
        v-for="(selection, i) in codeSelections"
        :key="i"
        :path="selection.path"
        :line-start="selection.lineStart"
        :line-end="selection.lineEnd"
        :language="selection.language"
        :code="selection.code"
        class="attachment"
      />
    </div>
    <div class="input-container">
      <div
        contenteditable="plaintext-only"
        :placeholder="placeholder"
        role="textbox"
        @input="onInput"
        @keydown="onKeyDown"
        tabindex="0"
        ref="input"
        data-cy="chat-input"
      />
      <v-popper text="Send message" placement="top" text-align="left" :disabled="!hasInput">
        <button class="send" data-cy="send-message" :disabled="!hasInput" @click="send">
          <v-send-icon />
        </button>
      </v-popper>
    </div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck

import VSendIcon from '@/assets/compass-icon.svg';
import VPopper from '@/components/Popper.vue';
import VCodeSelection from '@/components/chat/CodeSelection.vue';

export default {
  name: 'v-chat-input',
  components: {
    VSendIcon,
    VPopper,
    VCodeSelection,
  },
  props: {
    question: {
      type: String,
    },
    placeholder: {
      default: '',
    },
    codeSelections: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      input: '',
    };
  },
  computed: {
    hasInput() {
      return this.input !== '';
    },
  },
  methods: {
    onInput(e: Event) {
      if (!(e instanceof InputEvent)) return;

      const input = e.target as HTMLSpanElement;

      // Fix an issue where adding a newline would
      // cause the input to never be empty again.
      if (e.inputType === 'deleteContentBackward') {
        if (input.innerText === '\n') input.innerText = '';
      }

      this.input = input.innerText;
    },
    onKeyDown(e: Event) {
      if (!(e instanceof KeyboardEvent)) return;

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    },
    send() {
      if (!this.hasInput) return;

      this.$emit('send', this.input);
      this.input = '';
      (this.$refs.input as HTMLSpanElement).innerText = '';
    },
    focus() {
      (this.$refs.input as HTMLSpanElement).focus();
    },
  },
  updated() {
    this.focus();
  },
  mounted() {
    if (this.question) {
      this.$refs.input.innerText = this.question;
      this.input = this.question;
    }

    this.focus();
  },
};
</script>

<style lang="scss" scoped>
@keyframes glow {
  0%,
  100% {
    filter: drop-shadow(0 0 0.5rem #4983e0);
  }
  50% {
    filter: drop-shadow(0 0 1rem #7289c5);
  }
}

$border-color: #7289c5;

.chat-input {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid darken($gray4, 10%);
  box-shadow: 0 0 1rem 0rem $gray1;
  border-radius: $border-radius $border-radius 0 0;

  .attachments {
    color: $gray5;
    display: flex;
    flex-direction: column;
    align-items: start;

    .attachment {
      max-width: 100%;
    }
  }

  .input-container {
    position: relative;

    div[contenteditable] {
      border: 3px solid $border-color;
      padding: 0.66rem;
      padding-right: 3rem;
      background-color: #171b25;
      font-size: 1rem;
      color: white;
      animation: glow 4s infinite ease-in-out;
      font-family: inherit;
      resize: none;
      max-height: 200px;
      overflow-y: auto;
      overflow-x: hidden;

      &:empty:before {
        content: attr(placeholder);
        color: white;
      }

      &:focus-visible {
        outline: none !important;
      }
    }
    .popper {
      position: absolute;
      right: 1rem;
      bottom: 0.45rem;
      // transform: translate(-50%, -50%);

      &__text {
        border: none;
      }
      .send {
        height: 2rem;
        width: 2rem;
        padding: 0.25rem;
        border: none;
        border-radius: $border-radius;
        background-color: #6c81ba;
        transition: background-color 0.5s ease-in-out;
        svg {
          path {
            fill: #fff;
          }
        }
        &:disabled {
          pointer-events: none;
          background-color: rgba($color: #7289c5, $alpha: 0.25);

          svg {
            path {
              fill: #9aa9d3;
            }
          }
        }
        &:hover {
          cursor: pointer;
          background-color: $hotpink;
        }
      }
    }
  }
}
</style>
