<template>
  <div
    class="suggestion-card"
    :class="{ [status.status]: true, 'is-expanded': expanded, done }"
    @click="expanded = !expanded"
  >
    <div class="suggestion-card__meta">
      <span class="status" :class="{ [`status-${status.status}`]: true }" :title="statusTitle">
        <CircleEllipsis v-if="status.status === 'fix-in-progress'" :size="20" />
        <CircleAlert v-else-if="status.status === 'todo'" :size="20" />
        <CircleCheck v-else-if="done || fixReady" :size="20" />
        <component v-else :is="categoryIconComponent" :size="20" class="icon" />
      </span>
      <v-badge v-if="hasRuntime"><Zap :size="10" class="full icon-adjust" />Runtime</v-badge>
      <v-type-badge :type="type" />
      <v-priority-badge :priority="priority" class="meta-item" />
      <h4 class="title">{{ title }}</h4>
      <div v-if="!expanded" class="suggestion-card__title-area">
        <a
          class="file"
          :href="location"
          :title="location"
          @click.stop.prevent="$root.$emit('open-location', location)"
          >{{ location.replace(/^.*\//, '') }}</a
        >
        <a
          class="appmap-link"
          v-for="appmap in appMapReferences"
          :key="appmap.name"
          :href="appmap.path"
          :title="appmap.name"
          @click.stop.prevent="$root.$emit('open-location', appmap.path)"
        />

        <SuggestionButtons
          v-if="!expanded"
          :compact="true"
          :status="status"
          @fix="$emit('fix')"
          @done="$emit('done')"
          @dismiss="$emit('dismiss')"
          @reopen="$emit('reopen')"
        />
      </div>
    </div>
    <div v-if="expanded" class="suggestion-card__content">
      <p>{{ description }}</p>
      <p class="code">
        <a
          :href="location"
          :title="location"
          class="file-expanded"
          @click.stop.prevent="$root.$emit('open-location', location)"
          >{{ location }}</a
        >
        <v-code-snippet :clipboard-text="code" :language="language" :show-copy="false" />
      </p>
      <section class="appmaps" v-if="appMapReferences.length">
        <h5>Related AppMaps</h5>
        <ul>
          <li v-for="appmap in appMapReferences" :key="appmap.name">
            <a
              class="appmap-link"
              :href="appmap.path"
              :title="appmap.path"
              @click.stop.prevent="$root.$emit('open-location', appmap.path)"
              >{{ appmap.name }}</a
            >
          </li>
        </ul>
      </section>
      <SuggestionButtons
        :status="status"
        @fix="$emit('fix')"
        @done="$emit('done')"
        @dismiss="$emit('dismiss')"
        @reopen="$emit('reopen')"
        class="expanded-buttons"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { Component, PropType } from 'vue';
import {
  Wrench,
  RotateCcw,
  Trash,
  CircleCheck,
  CircleEllipsis,
  CircleAlert,
  Zap,
} from 'lucide-vue';
import VButton from '@/components/Button.vue';
import VPriorityBadge from '@/components/review/PriorityBadge.vue';
import VBadge from '@/components/Badge.vue';
import VTypeBadge from '@/components/review/TypeBadge.vue';
import VCodeSnippet from '@/components/CodeSnippet.vue';
import { getCategoryIconComponent, SuggestionStatus } from '.';
import { ReviewRpc } from '@appland/rpc';
import SuggestionButtons from './SuggestionButtons.vue';

export default Vue.extend({
  components: {
    VButton,
    VCodeSnippet,
    Wrench,
    RotateCcw,
    Trash,
    CircleCheck,
    VPriorityBadge,
    VBadge,
    Zap,
    VTypeBadge,
    CircleEllipsis,
    CircleAlert,
    SuggestionButtons,
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
      type: Object as PropType<SuggestionStatus>,
      required: false,
      default: () => ({ status: 'todo' } as SuggestionStatus),
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
    description: {
      type: String,
      required: false,
    },
    runtime: {
      type: Object as PropType<ReviewRpc.Suggestion['runtime']>,
      required: false,
      default: undefined,
    },
  },
  /* emits: ['fix', 'dismiss', 'reopen'], */
  data() {
    return {
      expanded: false,
    };
  },
  computed: {
    fixReady(): boolean {
      return this.status.status === 'fix-ready';
    },
    fixInProgress(): boolean {
      return this.status.status === 'fix-in-progress';
    },
    language(): string {
      if (this.location) {
        const ext = this.location.split('.').pop()?.split(':')[0];
        return ext ? ext.toLowerCase() : 'txt';
      }
      return 'txt';
    },
    appMapReferences() {
      return this.runtime?.appMapReferences || [];
    },
    hasRuntime(): boolean {
      return (this.runtime?.appMapReferences?.length ?? 0) > 0;
    },
    categoryIconComponent(): Component | undefined {
      return getCategoryIconComponent(this.category);
    },
    dismissed(): boolean {
      return this.status.status === 'dismissed';
    },
    done(): boolean {
      return this.status.status === 'fixed' || this.status.status === 'dismissed';
    },
    statusTitle(): string {
      const { reason, status } = this.status;
      switch (status) {
        case 'todo':
          return 'This suggestion needs to be addressed.';
        case 'fix-in-progress':
          return reason ? `Fix in progress: ${reason}` : 'Fix in progress';
        case 'fix-ready':
          return reason ? `Fix ready: ${reason}` : 'Fix is ready to be applied.';
        case 'fixed':
          return 'This suggestion has been addressed.';
        case 'dismissed':
          return reason ? `Dismissed: ${reason}` : 'This suggestion has been dismissed.';
        default:
          return 'Unknown status';
      }
    },
  },
});
</script>

<style scoped lang="scss">
.suggestion-card {
  background-color: $color-background-dark;
  padding: 0.5rem 1rem;
  transition: $transition;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: $border-radius-big;

  &.is-expanded {
    padding: 1rem;
    background-color: $color-background-dark;
    border: 1px solid $color-border;
  }

  &:hover:not(.is-dismissed) {
    border: 1px solid $color-highlight;
  }

  &.done {
    opacity: 0.7;
    .title {
      text-decoration: line-through;
    }
  }

  &__content {
    margin-top: 1rem;
    border-top: 1px solid $color-border;

    .appmaps {
      font-size: 1rem;
      h5 {
        opacity: 0.8;
        margin-top: 1rem;
        margin-bottom: 0.75rem;
        font-size: 1rem;
        font-weight: 500;
      }

      ul {
        padding: 0;
        margin-top: 0.5rem;
        margin-left: 0;
        margin-bottom: 1.25rem;

        li {
          list-style: none;
          margin: 0;
          padding: 0;

          a.appmap-link {
            color: $color-foreground-light;
            text-decoration: none;
            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }
  }

  &__main {
    min-width: 0;
  }

  &__title-area {
    display: flex;
    gap: 0.5rem;
    .icon {
      color: $color-foreground-secondary;
    }

    svg {
      position: relative;
      top: 2px;
    }
    margin-left: auto;
  }

  .title {
    color: $color-foreground-light;
    font-weight: 500;
    font-size: 1rem;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 30rem;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.875rem;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    margin-top: 1rem;
  }

  &__actions {
    display: flex;
    align-self: center;
    gap: 0;
  }
}

a.file {
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  align-content: center;
  margin-top: 0.5rem;
  font-size: 1rem;
}

a.file-expanded {
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  font-size: 1rem;
  margin-top: 0.5rem;
  margin-bottom: -0.25rem;
}

.expanded-buttons {
  margin-top: 1rem;
}

a.appmap-link {
  min-width: 0;
  min-height: 0;
  height: fit-content;
  width: fit-content;
  align-self: anchor-center;
  &::before {
    color: $hotpink;
    font-weight: 600;
    font-size: 0.75rem;
    content: 'Λ';
    margin-right: 0.5rem;
  }
}

.full {
  fill: currentColor;
}

.icon-adjust {
  transform: translateY(1px);
  padding-right: 0.15rem;
}

.status {
  display: flex;
}

.status-todo {
  color: $color-warning !important;
}
.status-dismissed {
  color: $color-foreground-secondary !important;
}
.status-fixed {
  color: $color-success !important;
}
.status-fix-ready {
  color: $color-warning !important;
}
.status-fix-in-progress {
  color: $color-warning !important;
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
    padding-right: 0.5rem;
  }
}
</style>
