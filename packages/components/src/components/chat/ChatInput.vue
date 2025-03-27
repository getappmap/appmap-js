<template>
  <div class="chat-input">
    <template v-if="freeUsage && threadCount > 0 && displaySubscription">
      <div class="usage" :data-usage="freeUsage" data-cy="usage-message">
        <span class="usage__message">
          You've used
          <span :class="{ 'usage--count': freeUsage === 'overLimit' }">{{ threadCount }}</span> of
          your
          <span :class="{ 'usage--count': freeUsage === 'overLimit' }">{{ maxThreadCount }}</span>
          chat sessions allowed with the free plan.
        </span>
        <a :href="subscribeUrl" data-cy="input-subscribe-link" target="_blank">
          <v-button class="sub-btn" kind="native-ghost" size="small">
            <v-external-link-icon class="sub-btn__icon" />
            Subscribe
          </v-button>
        </a>
      </div>
    </template>
    <div
      v-if="codeSelections && codeSelections.length"
      class="attachments"
      data-cy="input-attachments"
    >
      <v-code-selection
        v-for="selection in codeSelections"
        :key="selection.uri"
        v-bind="selection"
        class="attachment"
      />
    </div>
    <div class="input-container">
      <v-auto-complete
        :input="input"
        :commands="commands"
        @submit="onAutoComplete"
        ref="autocomplete"
      />
      <div
        :class="{ glow: useAnimation }"
        :contenteditable="isDisabled ? 'false' : 'plaintext-only'"
        :placeholder="placeholderOverride"
        :disabled="isDisabled"
        role="textbox"
        @input="onInput"
        @keydown="onKeyDown"
        tabindex="0"
        ref="input"
        data-cy="chat-input"
      />
      <v-popper
        v-if="!isStopActive"
        text="Send message"
        placement="top"
        align="right"
        :disabled="!hasInput || isDisabled"
      >
        <button class="control-button" data-cy="send-message" :disabled="!hasInput" @click="send">
          <v-send-icon />
        </button>
      </v-popper>
      <v-popper v-if="isStopActive" text="Stop" placement="top" text-align="left" align="right">
        <button
          class="control-button"
          data-cy="stop-response"
          :disabled="!isStopActive"
          @click="stop"
        >
          <v-stop-icon />
        </button>
      </v-popper>
    </div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck

import VSendIcon from '@/assets/compass-icon.svg';
import VStopIcon from '@/assets/stop-icon.svg';
import VPopper from '@/components/Popper.vue';
import VAutoComplete from '@/components/chat/AutoComplete.vue';
import VCodeSelection from '@/components/chat/CodeSelection.vue';
import VButton from '@/components/Button.vue';
import VExternalLinkIcon from '@/assets/external-link.svg';
import { NavieRpc } from '@appland/rpc';
import { PropType } from 'vue';
import { getSubscribeUrl } from '@/lib/subscribe';

export default {
  name: 'v-chat-input',
  components: {
    VSendIcon,
    VStopIcon,
    VPopper,
    VCodeSelection,
    VAutoComplete,
    VButton,
    VExternalLinkIcon,
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
    isStopActive: {
      type: Boolean,
      default: false,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    inputPlaceholder: {
      type: String,
      default: '',
    },
    commands: {
      type: Array<NavieRpc.V1.Metadata.Command[]>,
    },
    useAnimation: {
      type: Boolean,
      default: true,
    },
    usage: {
      type: Object as PropType<{
        conversationCounts: {
          daysAgo: number;
          count: number;
        }[];
      }>,
      default: () => ({ conversationCounts: [] }),
    },
    subscription: {
      type: Object as PropType<Object | undefined>,
      default: undefined,
    },
    email: {
      type: String,
    },
  },
  inject: {
    displaySubscription: {
      default: true,
    },
  },
  data() {
    return {
      input: '',
    };
  },
  computed: {
    placeholderOverride(): string | undefined {
      return this.inputPlaceholder ?? this.placeholder;
    },
    hasInput() {
      return this.input !== '';
    },
    isSelectingCommand() {
      return this.$refs.autocomplete.isVisible;
    },
    threadCount(): number {
      return this.usage.conversationCounts
        .filter(({ daysAgo }) => daysAgo === 7)
        .reduce((acc, { count }) => acc + count, 0);
    },
    maxThreadCount(): number {
      return 7;
    },
    isSubscribed(): boolean {
      return this.subscription?.subscriptions?.length > 0;
    },
    freeUsage(): 'withinLimits' | 'atMaxLimit' | 'overLimit' | undefined {
      if (this.isSubscribed) return undefined;
      if (this.threadCount > this.maxThreadCount) return 'overLimit';
      if (this.threadCount === this.maxThreadCount) return 'atMaxLimit';
      return 'withinLimits';
    },
    subscribeUrl(): string {
      return getSubscribeUrl(this.email);
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
      if (!(e instanceof KeyboardEvent));

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    },
    onAutoComplete(command: string) {
      this.prefixNewMode(command);
    },
    send() {
      if (!this.hasInput || this.isSelectingCommand || this.isStopActive || this.isDisabled) return;

      this.$emit('send', this.input);
      this.input = '';
      (this.$refs.input as HTMLSpanElement).innerText = '';
    },
    stop() {
      this.$emit('stop');
    },
    focus() {
      (this.$refs.input as HTMLSpanElement).focus();
    },
    prefixNewMode(mode: string) {
      const currentInput = (this.$refs.input as HTMLSpanElement).innerText || '';
      this.setInput(`${mode} ${currentInput.replace(/^\s*@[^\s]*\s*/g, '')}`);
      this.moveCursorToFirstWord();
    },
    setInput(input: string) {
      this.input = input;
      const inputEl: HTMLInputElement = this.$refs.input;
      inputEl.innerText = input;
      this.focus();
    },
    moveCursorToFirstWord() {
      const match = this.$refs.input.innerText.match(/\s+|$/);
      const index = match ? match.index + match[0].length : input.length;

      // Move the cursor to the end of the input
      const selection = window.getSelection();
      selection?.setPosition(this.$refs.input.lastChild, index);
    },
    moveCursorToEnd() {
      const selection = window.getSelection();
      selection?.setPosition(this.$refs.input.lastChild, this.$refs.input.innerText.length);
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

    window.onfocus = () => this.focus();
  },
};
</script>

<style lang="scss" scoped>
@keyframes glow {
  0%,
  100% {
    filter: drop-shadow(0 0 0.25rem $color-highlight);
  }
  50% {
    filter: drop-shadow(0 0 0.5rem $color-highlight-light);
  }
}

$border-color: rgba(white, 0.333);

.chat-input {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid $color-background-dark;
  box-shadow: 0 0 1rem 0rem $color-tile-shadow;
  border-radius: $border-radius $border-radius 0 0;

  .usage {
    font-size: 0.8em;
    margin-top: -0.5rem;
    line-height: 1.5;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;

    &__message {
      padding-right: 0.1em;
    }

    &--count {
      font-weight: bold;
      background-color: $color-foreground;
      color: $color-background;
      padding: 0.05em 0.25em 0.1em 0.2em;
      border-radius: 1em;
    }

    &[data-usage='overLimit'] {
      color: $color-error;
      .usage--count {
        background-color: $color-error;
        color: $color-background;
      }
      .sub-btn {
        border-color: $color-error;
        color: $color-error;

        &__icon {
          fill: $color-error;
        }

        &:hover {
          color: inherit;
          border-color: inherit;
          .sub-btn__icon {
            fill: $color-highlight !important;
          }
        }
      }
    }

    .sub-btn {
      margin-left: auto;
      &__icon {
        fill: $color-foreground;
        width: 1em;
        height: 1em;
        margin-right: 0.25em;
        vertical-align: middle;
        transition: fill 0.2s ease-in-out;
      }
    }

    a {
      color: $color-link;
      text-decoration: none;
      &:hover {
        color: $color-link-hover;
        text-decoration: underline;
      }
    }
  }

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
      border: 3px solid $color-highlight;
      padding: 0.66rem;
      padding-right: 3rem;
      background-color: $color-input-bg;
      font-size: 1rem;
      color: $color-input-fg;
      font-family: inherit;
      resize: none;
      max-height: 200px;
      overflow-y: auto;
      overflow-x: hidden;
      cursor: text;

      &[disabled] {
        animation: none !important;
        border-color: rgba(white, 0.16);
        background-color: rgba(#6c81ba, 0.13);
        cursor: not-allowed;

        &:empty:before {
          content: attr(placeholder);
          color: rgba(white, 0.25) !important;
          cursor: not-allowed;
        }

        & + .popper.control-button {
          cursor: not-allowed;
        }
      }

      &:empty:before {
        content: attr(placeholder);
        color: lighten($gray4, 10%);
        cursor: text;
      }

      &:focus-visible {
        outline: none !important;
      }
      &.glow {
        animation: glow 4s infinite ease-in-out;
      }
    }

    .popper {
      position: absolute;
      right: 1rem;
      bottom: 0.45rem;

      &__text {
        border: none;
      }

      .control-button {
        height: 2rem;
        width: 2rem;
        padding: 0.25rem;
        border: none;
        border-radius: $border-radius;
        background-color: $color-highlight;
        transition: background-color 0.5s ease-in-out;

        svg {
          path {
            fill: $color-foreground;
          }
        }

        &:disabled {
          background-color: $color-highlight-dark;
          cursor: not-allowed !important;

          svg {
            path {
              fill: #9aa9d3;
            }
          }

          &:hover {
            background-color: $color-highlight-dark;
          }
        }

        &:hover {
          cursor: pointer;
          background-color: $color-highlight-light;
        }
      }
    }
  }
}
</style>
