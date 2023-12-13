<template>
  <div class="message" :data-actor="isUser ? 'user' : 'system'">
    <div class="avatar">
      <!-- <img :src="avatar" /> -->
      <v-component :is="avatar" />
    </div>
    <div class="name">{{ name }}</div>
    <div class="message-body" v-html="renderedMarkdown" />
    <div class="buttons">
      <span
        v-if="!isUser"
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
        v-if="!isUser"
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
import VAppmapLogo from '@/assets/appmap-logomark.svg';
import VUserAvatar from '@/assets/user-avatar.svg';
import VThumbIcon from '@/assets/thumb.svg';
import VButton from '@/components/Button.vue';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);

export default {
  name: 'v-user-message',

  components: {
    VAppmapLogo,
    VUserAvatar,
    VThumbIcon,
    VButton,
  },

  props: {
    id: {
      required: false,
    },
    isUser: {
      default: false,
    },
    message: {
      default: '',
    },
    sentiment: {
      default: 0,
    },
  },

  data() {
    return { sentimentTimeout: undefined };
  },

  computed: {
    dynamicMessage() {
      return this.message || '...';
    },
    avatar() {
      return this.isUser ? VUserAvatar : VAppmapLogo;
    },
    name() {
      return this.isUser ? 'You' : 'AppMap';
    },
    renderedMarkdown() {
      const markdown = marked.parse(this.dynamicMessage);
      return DOMPurify.sanitize(markdown);
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
  },
};
</script>

<style lang="scss" scoped>
@import '~highlight.js/styles/base16/snazzy.css';

.message {
  display: grid;
  grid-template-columns: 32px 1fr;
  grid-template-rows: 16px 1fr;
  background-color: $gray2;
  gap: 0.5rem 1.5rem;
  padding: 0 0.5rem;
  color: #ececec;

  .avatar {
    width: 32px;
    height: 32px;
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
  }

  &:hover {
    .buttons .button {
      opacity: 100%;
    }
  }

  &:last-of-type {
    .buttons .button {
      opacity: 100%;
    }
  }

  .buttons {
    grid-column: 2;
    height: 1.5rem;
    margin-bottom: 0.5rem;

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

  p:first-child {
    margin-top: 0;
  }

  p:last-child {
    margin-bottom: 0;
  }
}
</style>
