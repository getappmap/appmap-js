<template>
  <div class="code-snippet">
    <div class="code-snippet__header">
      <span class="code-snippet__language">{{ language }}</span>
      <span class="code-snippet__button-group">
        <span class="code-snippet__button" data-cy="apply" v-if="sourcePath">
          <v-apply-icon />
          Apply
        </span>
        <span class="code-snippet__button" data-cy="copy">
          <v-copy-icon />
          Copy
        </span>
      </span>
    </div>
    <div class="code-snippet__body">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import VCopyIcon from '@/assets/plain-clipboard.svg';
import VApplyIcon from '@/assets/export.svg';
import Vue from 'vue';

export default Vue.extend({
  props: {
    language: String,
    sourcePath: String,
  },
  components: {
    VCopyIcon,
    VApplyIcon,
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

    svg {
      height: 16px;
      width: 16px;
      vertical-align: text-bottom;

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
</style>
