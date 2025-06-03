<template>
  <div class="suggestion-card" :class="{ 'is-dismissed': dismissed }">
    <div class="suggestion-card__content">
      <div class="suggestion-card__main">
        <div class="suggestion-card__title-area">
          <CheckCircle v-if="dismissed" :size="20" :class="statusClass" />
          <component v-else :is="categoryIconComponent" :size="20" class="icon" />
          <h4 class="suggestion-card__title">{{ title }}</h4>
          <span v-if="runtime" class="tag tag--runtime">Runtime</span>
        </div>
        <div class="suggestion-card__meta mt-2">
          <span class="meta-item type">{{ type }}</span>
          <v-priority-badge :priority="priority" class="meta-item" />
          <code class="meta-item location">{{ location }}</code>
        </div>

        <div v-if="dismissed" class="suggestion-card__status mt-2">
          <span :class="statusClass">
            {{ statusText }}
          </span>
          <button @click="$emit('reopen', id)" class="reopen-button">
            <RotateCcw :size="16" />
            Reopen
          </button>
        </div>
      </div>
      <div class="suggestion-card__actions">
        <div v-if="!dismissed" class="action-menu-container">
          <v-button
            @click.stop.native="toggleActionMenu()"
            :ref="`actionMenuTrigger-${id}`"
            class="action-menu-button"
          >
            <MoreVertical :size="20" />
          </v-button>
          <div v-if="showActionMenu" class="action-menu-dropdown" :ref="`actionMenuDropdown-${id}`">
            <v-button
              @click.native="onAction('apply')"
              :disabled="action === 'apply'"
              class="action-menu-item"
            >
              <Loader2 v-if="action === 'apply'" :size="16" class="animate-spin" />
              <Wrench v-else :size="16" />
              Apply Fix
            </v-button>
            <v-button @click.native="onAction('explain')" class="action-menu-item">
              <HelpCircle :size="16" /> Explain
            </v-button>
            <v-button @click.native="onAction('todo')" class="action-menu-item">
              <FileCode :size="16" /> Add TODO
            </v-button>
            <v-button @click.native="onAction('fix')" class="action-menu-item">
              <Check :size="16" /> Mark Fixed
            </v-button>
            <v-button @click.native="onAction('dismiss')" class="action-menu-item">
              <Trash :size="16" /> Dismiss
            </v-button>
          </div>
        </div>
        <v-button kind="native-ghost" @click.native="$emit('details', id)"> Details </v-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { Component, PropType } from 'vue';
import {
  Wrench,
  HelpCircle,
  FileCode,
  Check,
  RotateCcw,
  Loader2,
  Trash,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  Database,
  Globe,
} from 'lucide-vue';
import VButton from '@/components/Button.vue';
import VPriorityBadge from '@/components/review/PriorityBadge.vue';
import { getCategoryIconComponent } from '.';

export default Vue.extend({
  components: {
    VButton,
    Wrench,
    HelpCircle,
    FileCode,
    Check,
    RotateCcw,
    Loader2,
    Trash,
    MoreVertical,
    CheckCircle,
    AlertTriangle,
    Database,
    Globe,
    VPriorityBadge,
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
    status: {
      type: String as PropType<'applied' | 'todo' | 'fixed' | 'dismissed'>,
      required: true,
      default: 'todo',
    },
    type: {
      type: String,
      required: false,
    },
    priority: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: false,
    },
    code: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      required: false,
    },
    stackTrace: {
      type: String,
      required: false,
    },
    sequenceDiagram: {
      type: String,
      required: false,
    },
    dismissed: {
      type: Boolean,
      default: false,
    },
    action: {
      type: String as PropType<'apply' | 'explain' | 'todo' | 'fix' | 'dismiss'>,
      required: false,
    },
  },
  data() {
    return {
      showActionMenu: false,
    };
  },
  computed: {
    categoryIconComponent(): Component | undefined {
      return getCategoryIconComponent(this.category);
    },
    priorityClass(): string[] {
      switch (this.priority) {
        case 'high':
          return ['priority-high'];
        case 'medium':
          return ['priority-medium'];
        case 'low':
          return ['priority-low'];
        default:
          return ['priority-default'];
      }
    },
    statusClass(): string[] {
      switch (this.status) {
        case 'applied':
          return ['status-applied'];
        case 'todo':
          return ['status-todo'];
        case 'fixed':
          return ['status-fixed'];
        case 'dismissed':
          return ['status-dismissed'];
        default:
          return ['status-unknown'];
      }
    },
    statusText(): string {
      switch (this.status) {
        case 'applied':
          return 'Applied';
        case 'todo':
          return 'TODO Added';
        case 'fixed':
          return 'Fixed';
        case 'dismissed':
          return 'Dismissed';
        default:
          'Status Unknown';
      }
      return 'Status Unknown';
    },
    runtime(): boolean {
      return Boolean(this.sequenceDiagram || this.stackTrace);
    },
  },
  methods: {
    toggleActionMenu() {
      this.showActionMenu = !this.showActionMenu;
    },
    onAction(action: 'apply' | 'explain' | 'todo' | 'fix' | 'dismiss') {
      this.$emit(action, this.id);
      this.showActionMenu = false;
    },
  },
});
</script>

<style scoped lang="scss">
.suggestion-card {
  background-color: $color-tile-background;
  padding: 1rem;
  border-radius: $border-radius-big;
  border: 1px solid $color-border;
  transition: $transition;

  &:hover:not(.is-dismissed) {
    border-color: rgba($color-highlight, 0.5);
  }

  &.is-dismissed {
    opacity: 0.7;
  }

  &__content {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  &__main {
    flex: 1;
  }

  &__title-area {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    .icon {
      color: $color-foreground-secondary;
    }
  }

  &__title {
    color: $color-foreground-light;
    font-weight: 500;
    margin: 0;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.875rem;

    .meta-item {
      color: $color-foreground-secondary;
      &.location {
        font-family: monospace;
        color: $color-link;
        cursor: pointer;
        transition: $transition;
        &:hover {
          color: $color-link-hover;
        }
      }
    }
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.status-applied {
  color: $color-success !important;
}
.status-todo {
  color: $color-warning !important;
}
.status-fixed {
  color: $color-highlight-light !important;
}
.status-dismissed {
  color: $color-foreground-secondary !important;
}
.status-unknown {
  color: $color-foreground-secondary !important;
}

.action-menu-container {
  position: relative;
}
.action-menu-button {
  padding: 0.5rem;
  color: $color-foreground-secondary;
  border-radius: $border-radius;
  transition: $transition;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: $color-foreground-light;
    background-color: $color-background-dark;
  }
}

.action-menu-dropdown {
  position: absolute;
  right: 0;
  margin-top: 0.5rem;
  width: 12rem;
  background-color: $color-tile-background;
  border-radius: $border-radius;
  box-shadow: $shadow-tile;
  padding: 0.25rem 0;
  z-index: 10;
  border: 1px solid $color-border;
}

.action-menu-item {
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  color: $color-foreground-light;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: $transition;
  font-size: $font-size;

  &:hover {
    background-color: $color-background-dark;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  svg {
    opacity: 0.8;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
