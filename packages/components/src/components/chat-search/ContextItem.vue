<template>
  <div class="context__body__table-row">
    <div class="context__body__table-row__header" @click="openLocation">
      <v-code-icon v-if="isCodeSnippet" class="row-icon" />
      <v-white-appmap-logo v-else class="row-icon" />
      <div>{{ header }}</div>
    </div>
    <div class="context__body__table-row__content">
      <span v-html="highlightedContent" />
    </div>
  </div>
</template>
<script lang="ts">
//@ts-nocheck
import { Marked, Renderer } from 'marked';
import { markedHighlight } from 'marked-highlight';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import VCodeIcon from '@/assets/code-icon.svg';
import VWhiteAppmapLogo from '@/assets/jetbrains_run_config_execute_dark.svg';

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
  name: 'v-context-item',

  components: {
    VCodeIcon,
    VWhiteAppmapLogo,
  },

  props: {
    contextItem: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },

  computed: {
    highlightedContent() {
      return this.getContext();
    },
    language() {
      switch (this.contextItem.type) {
        case 'code-snippet':
          // Return the file extension, without line numbers
          return this.contextItem.location
            .replace(/:\d+(-\d+)?$/, '')
            .split('.')
            .pop();

        case 'sequence-diagram':
          return 'plantuml';

        case 'data-request':
          if (this.contextItem.content.startsWith('query:')) {
            return 'sql';
          }

        // fall through

        default:
          return 'plaintext';
      }
    },
    header() {
      if (this.contextItem.location) {
        if (this.contextItem.type === 'code-snippet') {
          return this.contextItem.location;
        } else {
          const [path] = this.contextItem.location.split(':');
          const appmapName = path.split(/[\\/]/).pop();
          return appmapName.split('.').shift().replace(/_/g, ' ');
        }
      } else {
        // TODO: This should be CSS
        return this.stripPrefix(this.contextItem.content).slice(0, 25) + '...';
      }
    },
    isCodeSnippet() {
      return this.contextItem.type === 'code-snippet';
    },
  },

  methods: {
    toggleContent() {
      this.showContent = !this.showContent;
    },
    getContext() {
      const markdown = `\`\`\`${this.language}\n${this.stripPrefix(
        this.contextItem.content
      )}\n\`\`\`\n\n`;
      return this.renderMarkdown(markdown);
    },
    stripPrefix(text) {
      // i.e. strip 'query: ' from 'query: SELECT * FROM table'
      return text.replace(/^[a-z]+:/, '');
    },
    renderMarkdown(text) {
      const markdown = marked.parse(text);
      return DOMPurify.sanitize(markdown);
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
    hasClipboardAPI() {
      return (
        navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function'
      );
    },
    openLocation() {
      if (this.contextItem.location) {
        this.$root.$emit('open-location', this.contextItem.location);
      }
    },
  },

  mounted() {
    this.bindCopyButtons();
  },
};
</script>
<style lang="scss">
@import '~highlight.js/styles/base16/snazzy.css';

.context__body__table-row {
  border-bottom: 1px solid $gray3;

  &__header {
    padding: 0.65rem;
    cursor: pointer;
    color: lighten($gray4, 20%);
    display: flex;
    height: 100%;

    .row-icon {
      margin-right: 0.75rem;
      width: 18px;
    }

    &:hover {
      background-color: rgba(200, 200, 255, 0.25) !important;
    }

    &.dark {
      background-color: rgba(0, 0, 0, 0.85);
    }
  }

  &__content {
    margin: 0 0 2rem 1rem;

    span {
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
    }
  }
}
</style>
