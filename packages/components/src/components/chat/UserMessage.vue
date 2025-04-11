<template>
  <div
    class="message"
    data-cy="message"
    :data-actor="isUser ? 'user' : 'system'"
    :data-error="isError"
  >
    <div class="avatar">
      <!-- <img :src="avatar" /> -->
      <v-component :is="avatar" />
    </div>
    <div class="name">{{ name }}</div>
    <div class="message-body" data-cy="message-text" v-if="isUser">
      <span>{{ message }}</span>
      <div class="message-attachments" v-if="messageAttachments">
        <v-code-selection
          v-for="attachment in messageAttachments"
          :key="attachment.uri"
          :uri="attachment.uri"
          :content="attachment.content"
        />
      </div>
    </div>
    <div class="message-body" data-cy="message-text" v-else>
      <div class="tools" v-if="tools && !tokens.length">
        <v-tool-status
          v-for="(tool, i) in tools"
          :key="i"
          :complete="tool.complete"
          :title="tool.title"
          :status="tool.status"
        />
      </div>
      <v-streaming-message-content
        ref="streamingContent"
        class="streaming-content"
        :data-active="!complete && !toolsPending"
        :content="renderedMarkdown"
        :active="!complete"
      />
      <div
        v-if="complete"
        class="next-step-suggestions"
        data-cy="next-step-suggestions"
        :data-fetched="promptSuggestions !== undefined"
      >
        <div class="next-step-suggestions__buttons" v-if="promptSuggestions">
          <v-popper
            v-for="(i, index) in promptSuggestions"
            :key="index"
            placement="top"
            align="left"
            :time-to-display="500"
          >
            <template #content>
              <div class="key-binds" v-if="promptSuggestions">
                <div class="key-binds__option">
                  <span class="keyboard">Click</span>
                  <span class="keyboard-plus">To add prompt to input</span>
                </div>
                <div class="key-binds__option">
                  <span class="keyboard">Shift</span>
                  <span class="keyboard-plus">+</span>
                  <span class="keyboard">Click</span>
                  <span class="keyboard-plus">To submit this suggestion</span>
                </div>
              </div>
            </template>
            <v-next-prompt-button
              data-cy="next-step-button"
              :command="i.command"
              :prompt="i.prompt"
            >
              {{ nextStepSuggestionText(i) }}
            </v-next-prompt-button>
          </v-popper>
        </div>
      </div>
    </div>
    <div class="buttons" v-if="complete">
      <span
        v-if="!isUser && id && hasClipboardAPI"
        class="button"
        data-cy="copy-message"
        @click="copyToClipboard"
      >
        <v-check-icon v-if="copiedMessageTimeout" class="check-icon" data-cy="check-icon" />
        <v-clipboard-icon v-else class="copy-icon small" data-cy="copy-icon" />
      </span>
      <span class="button" v-if="!isUser" data-cy="save-message" @click="saveMessage">
        <v-save-icon class="copy-icon small" />
      </span>
    </div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import { PropType } from 'vue';
import VNavieCompass from '@/assets/compass-icon.svg';
import VUserAvatar from '@/assets/user-avatar.svg';
import VClipboardIcon from '@/assets/copy-icon.svg';
import VCheckIcon from '@/assets/success-checkmark.svg';
import VSaveIcon from '@/assets/download.svg';
import VButton from '@/components/Button.vue';
import VToolStatus from '@/components/chat/ToolStatus.vue';
import VCodeSelection from '@/components/chat/CodeSelection.vue';
import VStreamingMessageContent from '@/components/chat-search/StreamingMessageContent.ts';
import VNextPromptButton from '@/components/chat/NextPromptButton.vue';
import VPopper from '@/components/Popper.vue';

import markedChangeExtension from '@/components/chat/markedChangeExtension.ts';

import { Marked, Renderer } from 'marked';
import DOMPurify from 'dompurify';

const customRenderer = new Renderer();
const linkRenderer = customRenderer.link;
customRenderer.link = (href: string, title: string, text: string) => {
  const linkHtml = linkRenderer(href, title, text);
  const isWebsite = href.match(/^https?:\/\//);
  if (isWebsite) {
    // Links to external websites should always open in a new tab.
    return linkHtml.replace('<a', '<a target="_blank" rel="noopener noreferrer"');
  }

  return linkHtml.replace(/<a/, '<a emit-event');
};

const marked = new Marked({
  renderer: customRenderer,
  extensions: [markedChangeExtension],
});

export default {
  name: 'v-user-message',

  components: {
    VNavieCompass,
    VUserAvatar,
    VButton,
    VToolStatus,
    VCodeSelection,
    VClipboardIcon,
    VCheckIcon,
    VSaveIcon,
    VStreamingMessageContent,
    VNextPromptButton,
    VPopper,
  },

  props: {
    id: {
      required: false,
    },
    isUser: {
      default: false,
    },
    isError: {
      default: false,
    },
    tokens: {
      default: () => [],
    },
    sentiment: {
      default: 0,
    },
    complete: {
      default: false,
    },
    tools: {
      default: () => [],
    },
    messageAttachments: {
      default: () => [],
    },
    threadId: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    promptSuggestions: {
      type: Array as PropType<NavieRpc.V1.Suggest.NextStep[] | undefined>,
      default: undefined,
    },
  },

  data() {
    return {
      sentimentTimeout: undefined,
      copiedMessageTimeout: undefined,
    };
  },

  computed: {
    toolsPending(): boolean {
      // If we've began emitting tokens, ignore any tool status
      if (this.tokens.length > 0) return false;

      return this.tools.length > 0 && this.tools.some((t) => !t.complete);
    },
    message(): string {
      return this.tokens
        .map((t) => {
          if (typeof t === 'string') return t;
          if (typeof t === 'object' && 'type' in t) {
            if (t.type === 'tag') {
              switch (t.tag) {
                case 'appmap': {
                  let prompt, reasoning;
                  for (const [key, value] of t.attributes) {
                    if (key === 'prompt') prompt = value;
                    else if (key === 'reasoning') reasoning = value;
                  }
                  return `<v-inline-recommendation prompt="${prompt}" reasoning="${reasoning}"></v-inline-recommendation>`;
                }
                default:
                  return t.raw;
              }
            } else if (t.type === 'code-block')
              return `<v-code-fenced-content uri="${t.uri}"></v-code-fenced-content>`;
          }
        })
        .join('');
    },
    avatar() {
      return this.isUser ? VUserAvatar : VNavieCompass;
    },
    name() {
      return this.isUser ? 'You' : 'Navie';
    },
    renderedMarkdown() {
      const markdown = marked.parse(this.message);
      return DOMPurify.sanitize(markdown, {
        USE_PROFILES: { html: true },
        ADD_TAGS: [
          'v-next-prompt-button',
          'v-code-fenced-content',
          'v-inline-recommendation',
          'v-markdown-code-snippet',
          'change',
          'modified',
          'original',
        ],
        ADD_ATTR: [
          'uri',
          'command',
          'prompt',
          'target',
          'emit-event',
          'reasoning',
          'language',
          'location',
        ],
        ALLOWED_URI_REGEXP:
          /^(?:(?:(?:f|ht)tps?|mailto|event|file|urn):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });
    },
    hasClipboardAPI() {
      return (
        navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function'
      );
    },
  },

  methods: {
    async writeToClipboard(text) {
      if (text && typeof text === 'string' && this.hasClipboardAPI)
        await navigator.clipboard.writeText(text.replace(/\n/g, '\n'));
    },
    bindCopyButtons() {
      if (!this.hasClipboardAPI) return;

      this.$el.querySelectorAll('.md-code-snippet__copy').forEach((copyButton) => {
        copyButton.addEventListener('click', async () => {
          const codeSnippet = copyButton.closest('.md-code-snippet');
          const code = codeSnippet.querySelector('code');
          if (!code) return;

          await this.writeToClipboard(code.innerText);
        });
      });
    },
    renderRawMessage() {
      let buffer = '';
      for (const token of this.tokens) {
        if (typeof token === 'string') {
          buffer += token;
        } else if (typeof token === 'object' && 'type' in token && token.type === 'hidden') {
          buffer += token.content;
        }
      }
      return buffer.trim();
    },
    async copyToClipboard() {
      if (this.copiedMessageTimeout) return;

      const text = this.renderRawMessage();
      if (text && this.hasClipboardAPI) {
        this.copiedMessageTimeout = setTimeout(() => {
          this.copiedMessageTimeout = undefined;
        }, 2000);

        await this.writeToClipboard(text);
      }
    },
    saveMessage() {
      this.$root.$emit('save-message', {
        messageId: this.id,
        threadId: this.threadId,
        content: this.renderRawMessage(),
      });
    },
    nextStepSuggestionText(suggestion) {
      return suggestion.command !== 'explain'
        ? `@${suggestion.command} ${suggestion.label}`
        : suggestion.label;
    },
  },
};
</script>

<style lang="scss">
.streaming-content[data-active] {
  @keyframes cursor-blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }

  &::after {
    content: '';
    display: block;
    height: 1rem;
    width: 1rem;
    background-color: $color-foreground;
    animation: cursor-blink 1s infinite ease;
    display: inline-block;
  }
}
</style>

<style lang="scss" scoped>
@keyframes skeleton {
  0% {
    background-position: -100% 0%;
  }
  100% {
    background-position: 100% 0%;
  }
}
.message {
  display: grid;
  grid-template-columns: 38px calc(100% - 38px - 1rem);
  grid-template-rows: 16px 1fr;
  gap: 0.5rem 1rem;
  padding: 0 1rem;
  color: $color-foreground;
  overflow: visible;

  &[data-actor='user'] .message-body span {
    white-space: preserve;
  }

  .avatar {
    width: 38px;
    height: 38px;
    overflow: hidden;
    grid-column: 1;
    border-radius: 50%;

    svg {
      overflow: visible;

      path,
      circle {
        fill: $color-foreground;
      }
      rect {
        fill: $color-background;
      }
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  .name {
    font-weight: bold;
    grid-column: 2;
  }

  .message-body {
    grid-column: 2;
    grid-row: 2;
    max-width: 100%;

    :last-child {
      margin-bottom: 0;
    }

    .key-binds {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      &__option {
        display: flex;
      }

      .keyboard {
        background-color: rgba(white, 0.75);
        border-radius: 3px;
        border: 1px solid rgba(black, 0.2);
        box-shadow: 0 -2px 2px rgba(black, 0.3) inset, 0 2px 0 0 rgba(white, 0.5) inset;
        color: rgba(black, 0.75);
        display: inline-block;
        font-size: 0.85em;
        font-weight: 700;
        line-height: 1;
        padding: 3px 4px 2px 4px;
        white-space: nowrap;
        font-family: monospace;
      }

      .keyboard-plus {
        // font-size: 0.75em;
        padding: 0 0.25rem;
        align-self: center;
      }
    }

    .next-step-suggestions {
      display: flex;
      flex-direction: column;
      gap: 1px;
      margin-top: 0.5rem;

      &__buttons {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;

        &::v-deep {
          .popper__text {
            backdrop-filter: blur(12px);
            background-color: transparent;
            border-color: rgba(white, 0.2);
            margin-bottom: 2rem;
            padding: 0.25rem;

            &:before {
              display: none;
            }
          }
        }
      }

      &:not([data-fetched]) {
        $alpha: 0.075;
        width: 100%;
        height: 1.5rem;
        border-radius: $border-radius;
        background-color: rgba(black, 0.1);
        background: linear-gradient(
          90deg,
          rgba(black, $alpha) 0%,
          rgba(white, $alpha) 50%,
          rgba(black, $alpha) 100%
        );
        background-size: 200% 100%;
        animation: skeleton 3s linear infinite;
      }
    }
  }

  &:hover {
    .buttons .button {
      opacity: 100%;
    }
  }

  &:first-of-type {
    margin-top: 2rem;
  }

  &:last-of-type {
    margin-bottom: 2rem;
    .buttons .button {
      opacity: 100%;
    }
  }

  &:not(:last-of-type) {
    .next-step-suggestions {
      display: none;
    }
  }

  .buttons {
    grid-column: 2;
    height: 1.5rem;
    margin-bottom: 0.5rem;
    user-select: none;

    .button {
      opacity: 0%;
      transition: opacity 0.25s ease-in-out;
      display: inline-block;
      width: 1.5rem;
      cursor: pointer;
      padding: 1px;
    }

    .small {
      width: 90%;
      transform: scale(0.75);

      &:hover {
        transform: scale(0.85);
      }
    }

    .copy-icon {
      fill: $color-foreground;
      overflow: visible;

      &:hover {
        fill: $color-highlight;
      }
    }

    .check-icon {
      width: 85%;

      path {
        fill: $color-foreground;
      }
    }

    .sentiment {
      transform-origin: center center;

      svg {
        width: 100%;
        height: 100%;

        path {
          stroke: $color-foreground;
          fill: none;
        }
      }

      &:hover {
        svg path {
          stroke: $color-highlight;
        }
      }

      &--good {
        &:hover {
          transform: scale(1.1);
        }
      }

      &--bad {
        transform: rotate(180deg);
        &:hover {
          transform: rotate(180deg) scale(1.1);
        }
      }

      &--selected {
        border-radius: $border-radius;
        background: $color-button-bg;
        border: 1px solid $color-highlight;
        padding: 0px;
        opacity: 100% !important;
        svg path {
          stroke: $color-highlight;
        }
      }
    }
  }
}
</style>

<style lang="scss">
.cursor {
  &:after {
    content: '▊';
    animation-name: cursor-blink;
    animation-duration: 530ms;
    animation-iteration-count: infinite;
    animation-direction: alternate;
    color: $color-foreground;
    font-size: 1rem;
  }
}

@keyframes cursor-blink {
  from {
    opacity: 0;
  }
  50% {
    opacity: 0;
  }
  51% {
    opacity: 1;
  }
  to {
    opacity: 1;
  }
}

.message .message-body {
  line-height: 1.6;

  .message-attachments {
    margin-top: 0.25em;
    display: flex;
    flex-direction: column;
    gap: 0.25em;
  }

  .tools {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    line-height: normal;

    &:empty {
      display: none;
    }
  }

  li > div {
    margin: 0.5rem 0 1rem 0;
  }

  div {
    hr {
      border: none;
      border-top: 1px solid rgba(white, 0.1);
      margin: 1rem 0;
    }

    a {
      color: $color-link;
      text-decoration: none;

      &:hover {
        color: $color-link-hover;
        text-decoration: underline;
      }
    }

    ul {
      margin: 1rem 0;
      margin-block-start: 1em;
      margin-block-end: 1em;
    }

    & > :first-child {
      margin-top: 0;
    }

    & > :last-child {
      margin-bottom: 0;
    }
  }

  code {
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.25rem;
    padding-bottom: 0;
    font-family: monospace;
  }

  pre code {
    border: 0;
    padding: 0;
  }
}
</style>
