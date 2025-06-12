<template>
  <v-modal-container @close="$emit('close')">
    <template #footer>
      <div class="dialog-actions" v-if="!dismissed">
        <v-popper :time-to-display="250" text="Apply Fix" placement="top">
          <button
            class="action"
            @click="$emit('apply', id)"
            :loading="currentActions.includes('fix')"
            variant="primary"
          >
            <v-wrench-icon :size="16" />
            <span class="label">Apply Fix</span>
          </button>
        </v-popper>
        <v-popper :time-to-display="250" text="Explain" placement="top">
          <button
            class="action"
            @click="$emit('explain', id)"
            :loading="currentActions.includes('explain')"
          >
            <v-help-circle-icon :size="16" />
            <span class="label">Explain</span>
          </button>
        </v-popper>
        <v-popper :time-to-display="250" text="Add TODO" placement="top">
          <button class="action" @click="$emit('todo', id)">
            <v-file-code-icon :size="16" />
            <span class="label">Add TODO</span>
          </button>
        </v-popper>
        <v-popper :time-to-display="250" text="Mark Fixed" placement="top">
          <button class="action" @click="$emit('fixed', id)">
            <v-check-icon :size="16" />
            <span class="label">Mark Fixed</span>
          </button>
        </v-popper>
        <v-popper :time-to-display="250" text="Dismiss" placement="top">
          <button class="action" @click="openDismissDialog">
            <v-trash-icon :size="16" />
            <span class="label">Dismiss</span>
          </button>
        </v-popper>
      </div>
    </template>

    <div class="suggestion-modal-container">
      <h3 class="modal-title pr-8">{{ title }}</h3>
      <button @click="handleDialogClose" class="modal-close-button">
        <v-x-icon :size="20" />
      </button>

      <div class="meta">
        <v-badge v-if="runtime">runtime</v-badge>
        <v-badge>{{ type }}</v-badge>
        <v-priority-badge :priority="priority" />
      </div>

      <div class="info-block">
        <h4 class="info-block__title">Location</h4>
        <code class="info-block__code">{{ location }}</code>
      </div>

      <div class="info-block">
        <h4 class="info-block__title">Code</h4>
        <v-code-snippet
          :clipboard-text="code"
          :language="fileExtension"
          :show-copy="false"
          class="code-snippet"
        />
      </div>

      <div v-if="runtime" class="info-block">
        <h4 class="info-block__title">Runtime Analysis</h4>
        <div v-if="stackTrace" class="mb-4">
          <h5 class="info-block__subtitle">Stack Trace</h5>
          <v-code-snippet :clipboard-text="stackTrace" language="txt" class="code-snippet" />
        </div>

        <v-mermaid-diagram v-if="sequenceDiagram">
          {{ sequenceDiagram }}
        </v-mermaid-diagram>
      </div>

      <div v-if="showExplanation" class="explanation-block mt-6">
        <h4 class="info-block__subtitle">Explanation</h4>
        <p>This is a detailed explanation of the issue and its potential impact...</p>
      </div>
    </div>
  </v-modal-container>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import VPopper from '@/components/Popper.vue';
import VModalContainer from '@/components/review/ModalContainer.vue';
import VCodeSnippet from '@/components/CodeSnippet.vue';
import VMermaidDiagram from '@/components/chat/MermaidDiagram.vue';
import VPriorityBadge from '@/components/review/PriorityBadge.vue';
import VBadge from '@/components/Badge.vue';
import {
  X as VXIcon,
  Trash as VTrashIcon,
  Check as VCheckIcon,
  FileCode as VFileCodeIcon,
  CircleHelp as VHelpCircleIcon,
  Wrench as VWrenchIcon,
} from 'lucide-vue';

export default Vue.extend({
  components: {
    VPopper,
    VModalContainer,
    VXIcon,
    VTrashIcon,
    VCheckIcon,
    VFileCodeIcon,
    VHelpCircleIcon,
    VWrenchIcon,
    VCodeSnippet,
    VMermaidDiagram,
    VPriorityBadge,
    VBadge,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    stackTrace: {
      type: String,
      default: '',
    },
    sequenceDiagram: {
      type: String,
      default: '',
    },
    runtime: {
      type: Boolean,
      default: false,
    },
    dismissed: {
      type: Boolean,
      default: false,
    },
    currentActions: {
      type: Array as PropType<Array<'explain' | 'fix'>>,
      default: () => [],
    },
  },
  data() {
    return {
      showExplanation: false,
    };
  },
  computed: {
    fileExtension(): string {
      if (this.location) {
        const extension = this.location.split('.').pop();
        if (extension) {
          const withoutLineNumber = extension.split(':').shift();
          if (withoutLineNumber) {
            return withoutLineNumber;
          }
        }
      }
      return 'txt';
    },
  },
  methods: {
    handleDialogClose() {
      this.$emit('close');
    },
    toggleExplanation() {
      this.showExplanation = !this.showExplanation;
    },
    openDismissDialog() {
      this.$emit('dismiss', this.id);
    },
  },
});
</script>

<style scoped lang="scss">
.suggestion-modal-container {
  margin-bottom: 4em;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.875rem;
}

.code-snippet {
  max-width: min(90vw, 1000px);
}
.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $color-foreground-light;
  margin-bottom: 0.5rem;
}

.modal-close-button {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  color: $color-foreground-secondary;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  transition: $transition;
  &:hover {
    color: $color-foreground-light;
  }
}

@media (max-width: 670px) {
  .dialog-actions {
    .label {
      display: none;
    }
  }
}

@media (min-width: 670px) {
  .dialog-actions {
    &::v-deep {
      .popper__text {
        display: none;
      }
    }
  }
}

.dialog-actions {
  display: flex;
  justify-content: space-evenly;
  box-shadow: 0 0 0.25rem $color-tile-shadow;

  &::v-deep {
    .popper__text {
      color: $color-foreground;
      backdrop-filter: blur(12px);
      background-color: transparent;
      border-color: rgba(white, 0.2);
      border-bottom: 0;
      border-radius: $border-radius $border-radius 0 0;
      padding: 0.25rem;
      margin-top: -2em;

      &:before {
        display: none;
      }
    }
  }

  .action {
    display: inline-block;
    padding: 0.5rem 1rem;
    color: $color-foreground;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    background-color: transparent;
    user-select: none;
    border: none;

    &--pending {
      $bg: black;
      width: 16px;
      height: 50%;
      cursor: initial;

      &:hover {
        background-color: transparent !important;
      }

      &::v-deep > .loader .dot {
        filter: drop-shadow(0 0 0.25rem rgba(white, 1));
        background-color: $color-foreground !important;
      }
    }

    &--failure {
      svg path {
        stroke: $color-error !important;
      }
    }

    &--success {
      svg path {
        stroke: $color-success !important;
      }
    }

    svg {
      height: 16px;
      width: 16px;
      vertical-align: text-bottom;
      overflow: visible;

      path {
        stroke: $color-foreground;
      }
    }

    &--toggled {
      background-color: $color-button-bg-hover;
      svg {
        transform: scale(1.1);
        filter: drop-shadow(2px 2px 2px $color-tile-shadow);
        path {
          stroke: $color-button-fg;
        }
      }
      &:hover {
        background-color: $color-button-bg !important;
      }
    }

    &:hover {
      background-color: $color-button-bg;
      color: $color-button-fg;
      svg,
      path {
        stroke: $color-button-fg;
      }
    }
  }
}

.info-block {
  &__title {
    font-size: 0.875rem;
    font-weight: 500;
    color: $color-foreground-dark;
    margin-bottom: 0.5rem;
  }
  &__subtitle {
    font-size: 0.875rem;
    font-weight: 500;
    color: $color-foreground-secondary;
    margin-bottom: 0.5rem;
  }
  &__code {
    font-size: 0.875rem;
    font-family: monospace;
    color: $color-foreground-secondary;
    word-break: break-all;
  }
}
</style>
