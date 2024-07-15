<template>
  <div class="code-snippet" data-cy="code-snippet">
    <div class="code-snippet__header">
      <span class="code-snippet__language">{{ language }}</span>
      {{ handle }}
      <span class="code-snippet__button-group">
        <span class="code-snippet__button" @click="copyToClipboard" data-cy="copy">
          <v-copy-icon />
          Copy
        </span>
        <span
          :class="{ 'code-snippet__button': 1, 'code-snippet__button--pinned': pinned }"
          @click="pinObject"
          data-cy="pin"
        >
          <v-pin-icon />
        </span>
      </span>
    </div>
    <div class="code-snippet__body" data-cy="code-snippet-body" ref="codeSnippet">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import VCopyIcon from '@/assets/plain-clipboard.svg';
import VPinIcon from '@/assets/pin.svg';
import Vue from 'vue';

let globalId = 0;

export default Vue.extend({
  props: {
    language: String,
  },
  components: {
    VCopyIcon,
    VPinIcon,
  },
  computed: {
    code(): string {
      const elm = this.$refs.codeSnippet as HTMLElement;
      return elm ? elm.innerText : '';
    },
  },
  data() {
    return {
      pinned: false,
      handle: globalId++,
    };
  },
  methods: {
    copyToClipboard() {
      if (!this.code) return;

      navigator.clipboard.writeText(this.code);
    },
    pinObject() {
      this.pinned = !this.pinned;
      this.$root.$emit('pin-object', {
        handle: this.handle,
        language: this.language,
        content: this.code,
        pinned: this.pinned,
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.code-snippet {
  margin: 1rem 0;
  border-radius: $border-radius;
  background-color: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  line-height: 1 !important;
  position: relative;

  pre {
    margin: 0;
    border: 0;
    border-radius: 0;
    padding: 0.25rem 1rem;
    overflow: auto;
  }

  code {
    line-height: 1.6;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: rgba(0, 0, 0, 0.4);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__language {
    display: inline-block;
    padding: 0.25rem 1rem;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e4e5;
  }

  &__button-group {
    display: flex;
    justify-content: end;
  }

  &__button {
    display: inline-block;
    padding: 0.25rem 1rem;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e4e5;
    cursor: pointer;
    transition: background-color 0.5s ease-in-out;
    user-select: none;

    svg {
      height: 16px;
      width: 16px;
      vertical-align: text-bottom;

      path {
        fill: #e2e4e5;
      }
    }

    &--pinned {
      background-color: rgba(white, 0.25);
      svg {
        transform: scale(1.1);
        filter: drop-shadow(2px 2px 2px rgba(black, 0.75));
        path {
          fill: white;
        }
      }
      &:hover {
        background-color: rgba(white, 0.5) !important;
      }
    }

    &:hover {
      background-color: rgba(white, 0.25);
    }

    &:active {
      background-color: $blue;
      transition: background-color 0s;
    }
  }
}
</style>
