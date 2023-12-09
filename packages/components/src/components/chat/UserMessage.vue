<template>
  <div class="message">
    <div class="avatar">
      <!-- <img :src="avatar" /> -->
      <v-component :is="avatar" />
    </div>
    <div class="name">{{ name }}</div>
    <div class="message-body" v-html="renderedMarkdown" />
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VAppmapLogo from '@/assets/appmap-logomark.svg';
import VUserAvatar from '@/assets/user-avatar.svg';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      console.log(language);
      return hljs.highlight(code, { language }).value;
    },
  })
);

export default {
  name: 'v-user-message',

  components: {
    VAppmapLogo,
    VUserAvatar,
  },

  props: {
    isUser: {
      default: false,
    },
    message: {
      default: '',
    },
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
      const sanitizedMessage = DOMPurify.sanitize(this.dynamicMessage);
      return marked.parse(sanitizedMessage);
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
  row-gap: 0.5rem;
  padding: 0 1rem;
  color: #ececec;

  .avatar {
    width: 32px;
    height: 32px;
    overflow: hidden;
    margin-right: 1rem;
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
    margin-left: 1rem;
  }

  .message-body {
    grid-column: 2;
    grid-row: 2;
    margin-left: 1rem;
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

  pre code.hljs {
    border-radius: $border-radius;
    background-color: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  code:not(.hljs) {
    border-radius: 6px;
    background-color: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.375rem 0.25rem 0 0.25rem;
    color: #e2e4e5;
  }

  p:first-child {
    margin-top: 0;
  }
}
</style>
