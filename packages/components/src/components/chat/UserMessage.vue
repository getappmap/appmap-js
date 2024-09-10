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
      <div class="tools" v-if="codeSelections">
        <v-code-selection
          v-for="(snippet, i) in codeSelections"
          :key="i"
          :path="snippet.path"
          :lineStart="snippet.lineStart"
          :lineEnd="snippet.lineEnd"
          :language="snippet.language"
          :code="snippet.code"
        />
      </div>
      <span>{{ message }}</span>
    </div>
    <div class="message-body" data-cy="message-text" v-else>
      <div class="tools" v-if="tools">
        <v-tool-status
          v-for="(tool, i) in tools"
          :key="i"
          :complete="tool.complete"
          :title="tool.title"
          :status="tool.status"
        />
      </div>
      <v-streaming-message-content :content="renderedMarkdown" :active="!complete" />
      <div
        v-if="complete"
        class="next-step-suggestions"
        data-cy="next-step-suggestions"
        :data-fetched="nextStepSuggestions !== undefined"
      >
        <div class="next-step-suggestions__buttons" v-if="nextStepSuggestions">
          <v-popper
            v-for="(i, index) in nextStepSuggestions"
            :key="index"
            placement="top"
            align="left"
            :time-to-display="500"
          >
            <template #content>
              <div class="key-binds" v-if="nextStepSuggestions">
                <div class="key-binds__option">
                  <span class="keyboard">Click</span>
                  <span class="keyboard-plus">To select this option</span>
                </div>
                <div class="key-binds__option">
                  <span class="keyboard">Shift</span>
                  <span class="keyboard-plus">+</span>
                  <span class="keyboard">Click</span>
                  <span class="keyboard-plus">To add prompt to input</span>
                </div>
              </div>
            </template>
            <v-next-prompt-button
              data-cy="next-step-button"
              :command="i.command"
              :prompt="i.prompt"
            >
              {{ i.label }}
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
        <v-check-icon v-if="copiedMessageTimeout" class="check-icon" />
        <v-clipboard-icon v-else class="copy-icon" />
      </span>
      <span
        v-if="!isUser && id"
        data-cy="feedback-good"
        :class="{
          button: 1,
          sentiment: 1,
          'sentiment--good': 1,
          'sentiment--selected': sentiment > 0,
        }"
        @click="setSentiment(1)"
      >
        <v-thumb-icon />
      </span>
      <span
        v-if="!isUser && id"
        data-cy="feedback-bad"
        :class="{
          button: 1,
          sentiment: 1,
          'sentiment--bad': 1,
          'sentiment--selected': sentiment < 0,
        }"
        @click="setSentiment(-1)"
      >
        <v-thumb-icon />
      </span>
    </div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import { PropType } from 'vue';
import VNavieCompass from '@/assets/compass-icon.svg';
import VUserAvatar from '@/assets/user-avatar.svg';
import VThumbIcon from '@/assets/thumb.svg';
import VClipboardIcon from '@/assets/plain-clipboard.svg';
import VCheckIcon from '@/assets/success-checkmark.svg';
import VButton from '@/components/Button.vue';
import VToolStatus from '@/components/chat/ToolStatus.vue';
import VCodeSelection from '@/components/chat/CodeSelection.vue';
import VStreamingMessageContent from '@/components/chat-search/StreamingMessageContent.ts';
import VNextPromptButton from '@/components/chat/NextPromptButton.vue';
import VPopper from '@/components/Popper.vue';

import markedChangeExtension from '@/components/chat/markedChangeExtension.ts';

import { Marked, Renderer } from 'marked';
import DOMPurify from 'dompurify';

// Add a custom renderer to wrap code blocks in a container.
// We can add a copy button and other things here.
// TODO: Can we do this in a more elegant way? E.g. with a Vue component?
const customRenderer = new Renderer();
customRenderer.code = (code: string, language: string, escaped: boolean, sourcePath: string) => {
  if (language === 'mermaid') {
    return `<v-mermaid-diagram>${code}</v-mermaid-diagram>`;
  }

  // The location is URI encoded to avoid issues with special characters.
  return [
    '<v-markdown-code-snippet',
    language && ` language="${language.trim()}"`,
    sourcePath && ` location="${encodeURIComponent(sourcePath.trim())}"`,
    '>',
    new Option(code).innerHTML,
    '</v-markdown-code-snippet>',
  ].join('');
};

const marked = new Marked({
  renderer: customRenderer,
  extensions: [
    markedChangeExtension,
    {
      // Matches an HTML comment that contains a file path
      // Example: <!-- file: /path/to/file.py -->
      name: 'file-annotation',
      level: 'block',
      start(src: string) {
        const index = src.search(/^\s*?(?:`{3,}[^\s]*?\s+)?<!--\s*?/);
        return index > -1 ? index : false;
      },
      tokenizer(src: string) {
        // First, consider cases where the file directive is the first line of the code block
        let codeBlockMatch = /^\s*?`{3,}(.*?)\n([\s\S]+?)`{3,}/.exec(src);
        if (codeBlockMatch) {
          let [, language, content] = codeBlockMatch;
          const fileCommentMatch = /^\s*?<!--\s*?file:\s*?(.+)\s*?-->.*?\n/.exec(content);
          if (!fileCommentMatch) return false;

          const [, sourcePath] = fileCommentMatch;
          content =
            content.slice(0, fileCommentMatch.index) +
            content.slice(fileCommentMatch.index + fileCommentMatch[0].length);
          return {
            type: 'file-annotation',
            raw: codeBlockMatch[0],
            text: src,
            sourcePath,
            language: language.trim(),
            content,
          };
        }

        // Otherwise, the file directive should immediately precede the code block
        const fileCommentMatch = /^\s*?<!--\s*?file:\s*?(.+)\s*?-->/.exec(src);
        if (!fileCommentMatch) return false;

        codeBlockMatch = /\s*?```(.*?)\n([\s\S]+?)```/.exec(
          src.slice(fileCommentMatch.index + fileCommentMatch[0].length)
        );
        if (!codeBlockMatch) return false;

        const [, sourcePath] = fileCommentMatch;
        const [, language, content] = codeBlockMatch;

        return {
          type: 'file-annotation',
          raw: fileCommentMatch[0] + codeBlockMatch[0],
          text: src,
          sourcePath,
          language: language.trim(),
          content,
        };
      },
      renderer({ sourcePath, language, content }) {
        return this.parser.renderer.code(content, language, true, sourcePath);
      },
    },
  ],
});

interface Injected {
  rpcClient: AppMapRPC;
  threadId: string | undefined;
}

export default {
  name: 'v-user-message',

  components: {
    VNavieCompass,
    VUserAvatar,
    VThumbIcon,
    VButton,
    VToolStatus,
    VCodeSelection,
    VClipboardIcon,
    VCheckIcon,
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
    message: {
      default: '',
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
    codeSelections: {
      default: () => [],
    },
    threadId: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
  },

  data() {
    return {
      sentimentTimeout: undefined,
      copiedMessageTimeout: undefined,
      nextStepSuggestions: undefined as NavieRpc.V1.Suggest.NextStep[] | undefined,
    };
  },

  inject: {
    rpcClient: { default: () => ({ suggest: () => Promise.resolve([]) }) },
  },

  watch: {
    async complete(isComplete) {
      if (!isComplete || !this.threadId || this.isUser || this.nextStepSuggestions) return;

      const { rpcClient, threadId } = this as Injected;
      try {
        this.nextStepSuggestions = await rpcClient.suggest(threadId);
      } catch (e) {
        console.error('Failed to fetch next step suggestions:', e);
        this.nextStepSuggestions = [];
      }
    },
  },

  computed: {
    avatar() {
      return this.isUser ? VUserAvatar : VNavieCompass;
    },
    name() {
      return this.isUser ? 'You' : 'Navie';
    },
    renderedMarkdown() {
      const markdown = marked.parse(this.message.toString());
      return DOMPurify.sanitize(markdown, {
        USE_PROFILES: { html: true },
        ADD_TAGS: [
          'v-markdown-code-snippet',
          'v-mermaid-diagram',
          'v-next-prompt-button',
          'change',
          'modified',
          'original',
        ],
        ADD_ATTR: ['language', 'location', 'command', 'prompt'],
        ALLOWED_URI_REGEXP:
          /^(?:(?:(?:f|ht)tps?|mailto|event):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });
    },
    hasClipboardAPI() {
      return (
        navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function'
      );
    },
  },

  methods: {
    setSentiment(sentiment: number) {
      // Throttle sentiment changes to avoid spamming the server
      if (this.sentimentTimeout) return;
      this.sentimentTimeout = setTimeout(() => {
        this.sentimentTimeout = undefined;
      }, 250);

      // This shouldn't ever happen, but just in case
      if (!this.id) return;

      // If the sentiment is already set to this value, unset it
      const newSentiment = this.sentiment === sentiment ? 0 : sentiment;
      this.$emit('change-sentiment', this.id, newSentiment);
    },
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
    async copyToClipboard() {
      if (this.copiedMessageTimeout) return;

      const text = this.message.trim();
      if (text && this.hasClipboardAPI) {
        this.copiedMessageTimeout = setTimeout(() => {
          this.copiedMessageTimeout = undefined;
        }, 2000);

        await this.writeToClipboard(text);
      }
    },
  },

  updated() {
    // Bind the copy button to the clipboard API if it's available
    // This is sort of a hack as it'll re-run on every new token,
    // but this works for now.
    this.bindCopyButtons();
  },
};
</script>

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
  color: #ececec;
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

      rect {
        fill: rgba($color: #000000, $alpha: 0.2);
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

    .copy-icon {
      fill: desaturate(lighten($gray2, 20%), 10%);
      width: 90%;

      &:hover {
        fill: white;
      }
    }

    .check-icon {
      width: 85%;

      path {
        fill: white;
      }
    }

    .sentiment {
      transform-origin: center center;

      svg {
        width: 100%;
        height: 100%;

        path {
          stroke: desaturate(lighten($gray2, 25%), 10%);
          fill: none;
        }
      }

      &:hover {
        svg path {
          stroke: white;
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
        background: rgba(white, 0.05);
        border: 1px solid rgba(white, 0.02);
        padding: 0px;
        opacity: 100% !important;
        svg path {
          stroke: white;
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
    color: white;
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

  .tools {
    padding: 0.5rem 0;
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
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin: 1rem 0;
    }

    a {
      color: #0097fa;
      text-decoration: none;

      &:hover {
        color: lighten(#0097fa, 10%);
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
    background-color: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.25rem;
    padding-bottom: 0;
    font-family: monospace;
    color: #e2e4e5;
  }

  pre code {
    border: 0;
    background-color: transparent;
    padding: 0;
  }
}
</style>
