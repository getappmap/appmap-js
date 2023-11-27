<template>
  <div class="chat-input">
    <span
      contenteditable
      :placeholder="placeholder"
      role="textbox"
      @input="onInput"
      @keydown="onKeyDown"
      tabindex="0"
      ref="input"
    />
    <v-popper text="Send message" placement="top" text-align="left" :disabled="!hasInput">
      <button class="send" :disabled="!hasInput" @click="send">
        <v-send-icon />
      </button>
    </v-popper>
  </div>
</template>

<script lang="ts">
//@ts-nocheck

import VSendIcon from '@/assets/send.svg';
import VPopper from '@/components/Popper.vue';

export default {
  name: 'v-chat-input',
  components: {
    VSendIcon,
    VPopper,
  },
  props: {
    placeholder: {
      default: '',
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
    filter: drop-shadow(0 0 0.75rem #7289c5);
  }
}

$border-color: #7289c5;

.chat-input {
  position: relative;
  display: flex;
  padding: 1rem;

  span[contenteditable] {
    width: 100%;
    border: 3px solid $border-color;
    padding: 0.66rem;
    padding-right: 3rem;
    background-color: #171b25;
    font-size: 1rem;
    color: white;
    animation: glow 8s infinite ease-in-out;
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
    right: 1.8rem;
    bottom: 1.45rem;

    &__text {
      border: none;
    }

    .send {
      height: 2rem;
      width: 2rem;
      padding: 0.25rem;
      border: none;
      border-radius: $border-radius;
      background-color: lighten($border-color, 10%);
      transition: background-color 0.5s ease-in-out;

      &:disabled {
        pointer-events: none;
        background-color: rgba($color: #7289c5, $alpha: 0.25);
      }

      &:hover {
        cursor: pointer;
        background-color: white;
      }

      svg path {
        fill: black;
      }
    }
  }
}
</style>
