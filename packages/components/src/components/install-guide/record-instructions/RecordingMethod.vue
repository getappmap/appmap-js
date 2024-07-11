<template>
  <div
    :class="{ 'recording-method': true, 'recording-method--unsupported': !supported }"
    :data-sort-score="sortScore"
  >
    <div class="recording-method__header">
      <div class="recording-method__title-wrapper">
        <span class="recording-method__icon">
          <slot name="icon"></slot>
        </span>
        <h2 class="recording-method__title">{{ title }}</h2>
      </div>
      <v-badge v-if="supported && defaultBehavior" class="recording-method__badge">
        Enabled by default
      </v-badge>
      <v-badge v-else-if="supported && !defaultBehavior" class="recording-method__badge">
        manual toggle
      </v-badge>
      <v-badge v-else-if="!supported" class="recording-method__badge"> unsupported </v-badge>
    </div>
    <div class="recording-method__content">
      <slot v-if="supported" name="supported" />
      <template v-else>
        <div class="recording-method__disabled-explanation">
          This project does not support {{ titleLowercase || title }}.
        </div>
        <slot name="unsupported" />
      </template>
    </div>
    <div class="recording-method__footer">
      <a :href="documentationUrl" target="_blank">
        Documentation <v-external-link-icon class="recording-method__external-link-icon" />
      </a>
      <v-popper-menu position="top left" v-if="promptSuggestions" ref="promptSuggestionsMenu">
        <template #icon>
          <v-ask-navie-button />
        </template>
        <template #body>
          <div class="recording-method__ask-navie-button-list">
            <div class="recording-method__ask-navie-button-list__header">
              <h2>Select an option</h2>
            </div>
            <v-button
              kind="ghost"
              size="small"
              class="recording-method__prompt-suggestion"
              v-for="(p, i) in promptSuggestions"
              :key="i"
              @click.native="onPromptSuggestionClick(p)"
            >
              {{ p.label }}
            </v-button>
          </div>
        </template>
      </v-popper-menu>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VExternalLinkIcon from '@/assets/external-link.svg';
import VBadge from '@/components/Badge.vue';
import VAskNavieButton from '@/components/chat-search/AskNavieButton.vue';
import VPopperMenu from '@/components/PopperMenu.vue';
import VButton from '@/components/Button.vue';
import type { NaviePromptSuggestion } from '@/lib/buildPrompts';

export default Vue.extend({
  props: {
    title: {
      type: String,
      required: true,
    },
    titleLowercase: {
      type: String,
      required: false,
    },
    supported: {
      type: Boolean,
      default: true,
    },
    documentationUrl: {
      type: String,
      required: true,
    },
    defaultBehavior: {
      type: Boolean,
      default: false,
    },
    promptSuggestions: {
      type: Array as () => NaviePromptSuggestion[],
      default: () => [],
    },
  },
  components: {
    VExternalLinkIcon,
    VAskNavieButton,
    VBadge,
    VPopperMenu,
    VButton,
  },
  computed: {
    sortScore(): number {
      if (!this.supported) return -1;
      return this.defaultBehavior ? 1 : 0;
    },
  },
  methods: {
    onPromptSuggestionClick(suggestion: NaviePromptSuggestion) {
      this.$root.$emit('submit-to-navie', suggestion);
      const { promptSuggestionsMenu } = this.$refs;
      if (promptSuggestionsMenu instanceof Vue) {
        (promptSuggestionsMenu as unknown as { close: () => void }).close();
      }
    },
  },
});
</script>

<style scoped lang="scss">
.recording-method {
  border-radius: $border-radius;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 0;
  box-shadow: 0 0 1rem 0 rgba(black, 0.25);
  display: flex;
  flex-direction: column;
  justify-content: start;
  margin: 0;

  @mixin vertical-marginal {
    padding: 1rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
    background-color: rgba(black, 0.25);
  }

  &--unsupported {
    color: $gray4;

    .recording-method__header {
      svg,
      path {
        fill: $gray4;
      }
    }
  }

  &__title-wrapper {
    display: flex;
    gap: 0.5rem;
  }

  &__header {
    @include vertical-marginal;
    border-radius: $border-radius $border-radius 0 0;
    border-bottom: 1px solid rgba(white, 0.1);
    flex-direction: column;
    align-items: flex-start;
    h2 {
      margin: 0;
    }
  }

  &__footer {
    @include vertical-marginal;
    margin-top: auto;
    border-radius: 0 0 $border-radius $border-radius;
    border-top: 1px solid rgba(black, 0.1);
    justify-content: space-between;
  }

  &__content {
    padding: 0.25rem 1rem;
  }

  &__badge-block {
    display: contents;
    margin-right: auto;
  }

  &__badge {
    background-color: rgba($blue, 0.2);
    padding: 0.125rem 0.5rem;
    padding-top: 0.25rem;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background-color: rgba(black, 0.1);
    border: 1px solid rgba(white, 0.1);
    color: white;
    font-size: 1.5rem;

    svg {
      width: 1rem;
      height: 1rem;
    }
  }

  &__external-link-icon {
    width: 0.64rem;
    height: 0.64rem;
    fill: $powderblue;
  }

  a:hover {
    text-decoration: underline;
    svg {
      transition: $transition;
      fill: $white;
      transform: scale(1.25);
    }
  }

  &__title {
    font-size: 1.2rem;
    font-weight: bold;
  }

  &__ask-navie-button-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: -1rem;

    &__header {
      background-color: rgba(black, 0.25);
      margin: 0 -1rem 0 -1rem;
      padding: 0.25rem 1rem;
      border-bottom: 1px solid rgba(white, 0.1);

      h2 {
        margin: 0;
      }
    }
  }

  &__disabled-explanation {
    background-color: rgba($darkyellow, 0.1);
    border: 1px solid rgba($darkyellow, 0.2);
    color: mix($darkyellow, $gray4, 50%);
    border-radius: $border-radius;
    padding: 0.5rem;
    margin-top: 0.5rem;
  }

  &__prompt-suggestion {
    text-align: left;
    &:hover {
      background-color: rgba(white, 0.1);
    }
  }
}
</style>
