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
    <div class="message-body" data-cy="message-text" v-if="isUser">{{ message }}</div>
    <div class="message-body" data-cy="message-text" v-else>
      <div class="tools" v-if="tools.length">
        <v-tool-status
          v-for="(tool, i) in tools"
          :key="i"
          :complete="tool.complete"
          :title="tool.title"
          :status="tool.status"
        />
      </div>
      <div v-html="renderedMarkdown" />
    </div>
    <div class="buttons">
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
import VNavieCompass from '@/assets/compass-icon.svg';
import VUserAvatar from '@/assets/user-avatar.svg';
import VThumbIcon from '@/assets/thumb.svg';
import VButton from '@/components/Button.vue';
import VToolStatus from '@/components/chat/ToolStatus.vue';

import { Marked, Renderer } from 'marked';
import { markedHighlight } from 'marked-highlight';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

// Add a custom renderer to wrap code blocks in a container.
// We can add a copy button and other things here.
// TODO: Can we do this in a more elegant way? E.g. with a Vue component?
const customRenderer = new Renderer();
const originalRenderer = customRenderer.code.bind(customRenderer);
customRenderer.code = (code: string, language: string, escaped: boolean) => {
  const content = originalRenderer(code, language, escaped);
  return `<div class="md-code-snippet" data-cy="code-snippet">
    <div class="md-code-snippet__header">
      <span class="md-code-snippet__language">${language}</span>
      <span class="md-code-snippet__copy" data-cy="copy">
        <svg viewBox="0 0 17 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.46626 18.6334H1.36657V6.33434H12.2991V9.06747H13.6657V5.65106L12.9824 4.96778H10.9325V3.60121H9.56596C9.56291 2.87751 9.27295 2.18456 8.75969 1.67435C8.2476 1.1653 7.55488 0.879578 6.83283 0.879578C6.11077 0.879578 5.41806 1.1653 4.90597 1.67435C4.39271 2.18456 4.10275 2.87751 4.0997 3.60121H2.65114V4.96778H0.683283L0 5.65106V19.3167L0.683283 20H5.46626V18.6334ZM5.46626 3.3279C5.51679 3.05659 5.64828 2.80694 5.84342 2.6118C6.03856 2.41666 6.28821 2.28517 6.55952 2.23464C6.826 2.18263 7.10193 2.21118 7.35212 2.31664C7.60356 2.4122 7.81866 2.58427 7.96708 2.8086C8.14611 3.07172 8.2277 3.38908 8.19776 3.70592C8.16782 4.02276 8.02824 4.31921 7.80309 4.54414C7.57816 4.76929 7.28171 4.90887 6.96487 4.93881C6.64803 4.96875 6.33067 4.88716 6.06755 4.70813C5.84322 4.55971 5.67115 4.34461 5.57559 4.09317C5.46625 3.85392 5.42829 3.58819 5.46626 3.3279ZM15.1415 16.2556L13.6656 17.7451V10.434H12.299V17.7315L10.8231 16.2556L9.85289 17.2259L12.504 19.8633H13.4743L16.1118 17.2259L15.1415 16.2556ZM7.05145 10.5707H8.02171L10.6592 13.2081L9.68892 14.1784L8.21303 12.7025V20H6.84646V12.6888L5.37057 14.1784L4.40031 13.2081L7.05145 10.5707Z"/>
        </svg>
        Copy
      </span>
    </div>
    ${content}
  </div>`;
};

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  }),
  { renderer: customRenderer }
);

export default {
  name: 'v-user-message',

  components: {
    VNavieCompass,
    VUserAvatar,
    VThumbIcon,
    VButton,
    VToolStatus,
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
    tools: {
      default: () => [],
    },
  },

  data() {
    return { sentimentTimeout: undefined };
  },

  computed: {
    dynamicMessage() {
      return this.message.toString() || '...';
    },
    avatar() {
      return this.isUser ? VUserAvatar : VNavieCompass;
    },
    name() {
      return this.isUser ? 'You' : 'Navie';
    },
    renderedMarkdown() {
      const markdown = marked.parse(this.dynamicMessage);
      return DOMPurify.sanitize(markdown, {
        USE_PROFILES: { html: true },
      });
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

    bindCopyButtons() {
      if (
        !navigator ||
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== 'function'
      ) {
        return;
      }

      this.$el.querySelectorAll('.md-code-snippet__copy').forEach((copyButton) => {
        copyButton.addEventListener('click', async () => {
          const codeSnippet = copyButton.closest('.md-code-snippet');
          const code = codeSnippet.querySelector('code');
          if (!code) return;

          await navigator.clipboard.writeText(code.innerText.replace(/\n/g, '\n'));
        });
      });
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
@import '~highlight.js/styles/base16/snazzy.css';

.message {
  display: grid;
  grid-template-columns: 38px 1fr;
  grid-template-rows: 16px 1fr;
  gap: 0.5rem 1rem;
  padding: 0 1rem;
  color: #ececec;

  &[data-actor='user'] .message-body {
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
    overflow: hidden;

    :last-child {
      margin-bottom: 0;
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

  .buttons {
    grid-column: 2;
    height: 1.5rem;
    margin-bottom: 0.5rem;
    user-select: none;

    .button {
      opacity: 0%;
      transition: opacity 0.25s ease-in-out;
    }

    .sentiment {
      display: inline-block;
      width: 1.5rem;
      cursor: pointer;
      padding: 1px;
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
.message .message-body {
  line-height: 1.3rem;

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

  .tools {
    padding-bottom: 0.5rem;
  }

  .md-code-snippet {
    margin: 1rem 0;
    border-radius: $border-radius;
    background-color: rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;

    pre {
      margin: 0;
      border: 0;
      border-radius: 0;
      overflow: auto;
    }

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.4);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    &__language {
      display: inline-block;
      padding: 0.25rem 1rem;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      color: #e2e4e5;
    }

    &__copy {
      display: inline-block;
      padding: 0.25rem 1rem;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      color: #e2e4e5;
      cursor: pointer;
      transition: background-color 0.5s ease-in-out;

      svg {
        height: 16px;
        width: 16px;

        path {
          fill: #e2e4e5;
        }
      }

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }

      &:active {
        background-color: $blue;
        transition: background-color 0s;
      }
    }
  }

  code {
    border-radius: 6px;
    background-color: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.25em 0.25rem 0 0.25rem;
    color: #e2e4e5;
  }

  pre {
    padding: 1rem;
    border-radius: $border-radius;
    background-color: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    code {
      border: 0;
      background-color: transparent;
      padding: 0;
    }
  }

  ul {
    margin: 1rem 0;
    margin-block-start: 1em;
    margin-block-end: 1em;
  }

  span > :first-child {
    margin-top: 0;
  }

  span > :last-child {
    margin-bottom: 0;
  }
}
</style>
