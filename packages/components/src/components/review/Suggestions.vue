<template>
  <section id="suggestions" class="suggestions-section">
    <SectionHeading title="Suggestions" :loading="loading">
      <CategoryStats :items="suggestions" />
    </SectionHeading>

    <template v-if="!loading">
      <v-alert-box level="info" v-if="!includesRuntimeReferences">
        <p class="mt-0">
          AppMap's code review works whether or not you've recorded any runtime data, but you'll get
          the deepest insights if you first record AppMap trace data by exercising the changes in
          your application.
        </p>
        <p>
          <a href="#" @click.stop.prevent="viewRecordingInstructions">
            Click here to view instructions for recording AppMap data.
          </a>
        </p>
      </v-alert-box>
      <div v-if="!suggestions.length">
        <check class="inline-icon success" :size="18" />
        No issues, recommendations, or findings were identified. Everything looks clean and
        well-structured.
      </div>
    </template>

    <!-- Suggestions by category -->
    <div
      v-for="(items, category) in categorizedSuggestions"
      :key="category"
      :id="`${category}-suggestions`"
      class="category-section mb-12"
    >
      <div class="category-header">
        <component :is="getCategoryIconComponent(category)" :size="24" class="icon" />
        <h3 class="category-title">
          {{ category.replace('http', 'HTTP').replace('sql', 'SQL') }}
        </h3>
        <CategoryStats :items="items" />
      </div>

      <div class="suggestions-grid">
        <div v-for="suggestion in items" :key="suggestion.id">
          <v-suggestion-card
            v-bind="suggestion"
            @fix="handleFix(suggestion)"
            @dismiss="openDismissDialog(suggestion.id)"
            @reopen="reopenSuggestion(suggestion.id)"
            @done="markAsDone(suggestion.id)"
            :status="getSuggestionStatus(suggestion.id)"
          />
        </div>
      </div>
    </div>
    <v-skeleton-loader class="card-loader" v-if="loading" />

    <v-dismiss-modal
      @close="closeDismissDialog"
      @submit="dismissSuggestion"
      v-if="showDismissDialogForSuggestionId"
    />
  </section>
</template>

<script lang="ts">
import Vue, { Component, PropType } from 'vue';
import VSuggestionCard from './SuggestionCard.vue';
import VAlertBox from '@/components/AlertBox.vue';
import mermaid from 'mermaid';
import {
  TriangleAlert,
  Database,
  Globe,
  X,
  CircleCheck,
  Wrench,
  CircleHelp,
  FileCode,
  Check,
  RotateCcw,
  LoaderCircle,
  Trash,
  EllipsisVertical,
  Maximize2,
  Gauge,
} from 'lucide-vue';
import { mapState, mapActions } from 'vuex';

import SectionHeading from './SectionHeading.vue';
import VButton from '@/components/Button.vue';
import VPopper from '@/components/Popper.vue';
import VDismissModal from './DismissModal.vue';
import VSkeletonLoader from '@/components/SkeletonLoader.vue';
import CategoryStats from './CategoryStats.vue';
import { type Suggestion, type SuggestionStatus, getCategoryIconComponent } from '.';

export default Vue.extend({
  name: 'SuggestionsList',
  components: {
    SectionHeading,
    VButton,
    VPopper,
    TriangleAlert,
    Database,
    Globe,
    Gauge,
    X,
    CircleCheck,
    Wrench,
    CircleHelp,
    FileCode,
    Check,
    RotateCcw,
    LoaderCircle,
    Trash,
    EllipsisVertical,
    Maximize2,
    VSuggestionCard,
    VDismissModal,
    VSkeletonLoader,
    CategoryStats,
    VAlertBox,
  },
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    suggestions: {
      type: Array as PropType<Suggestion[]>,
      default: () => [],
    },
    onSuggestionDismiss: {
      type: Function as PropType<(id: string) => void>,
      default: () => () => {},
    },
    includesRuntimeReferences: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selectedSuggestion: undefined as Suggestion | undefined,
      showDismissDialogForSuggestionId: undefined as string | undefined,
      showExplanation: false,
      isLoading: undefined as { id: string; action: 'apply' | 'explain' } | undefined,
      openActionMenu: undefined as string | undefined,
    };
  },
  computed: {
    ...mapState(['suggestionStatuses']),
    summaryCategories(): { name: string; stats: { high: number; medium: number } }[] {
      return (['security', 'sql', 'http'] as const).map((category) => ({
        name: category,
        stats: this.getCategoryStats(category),
      }));
    },
    categorizedSuggestions(): Record<string, Suggestion[]> {
      const categories: Record<string, Suggestion[]> = {};
      for (const suggestion of this.suggestions) {
        if (!categories[suggestion.category]) {
          categories[suggestion.category] = [];
        }
        categories[suggestion.category].push(suggestion);
      }
      // Sort each category by priority
      for (const category in categories) {
        categories[category].sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
      }
      return categories;
    },
  },
  watch: {
    selectedSuggestion: 'renderMermaidDiagram',
    // `showFullDiagram` was removed, assuming diagram container resizes with modal or content
    // If `showFullDiagram` state is still needed, add it to data and watch it
  },
  mounted() {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark', // Or use your SCSS variables if Mermaid supports CSS vars for theming
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: false,
      },
      themeVariables: {
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', // Use $font-family
        fontSize: '14px', // Use $font-size
        lineColor: '#60a5fa', // Map to $color-highlight or similar
        primaryColor: '#3b82f6', // Map to $color-highlight
        primaryTextColor: '#e5e7eb', // Map to $color-foreground-light
        primaryBorderColor: '#60a5fa', // Map to $color-highlight
        noteBkgColor: '#1f2937', // Map to $color-input-bg or $color-background-dark
        noteTextColor: '#e5e7eb', // Map to $color-foreground-light
        noteBorderColor: '#374151', // Map to $color-border
      },
    });
    document.addEventListener('mousedown', this.handleClickOutsideActionMenu);
  },
  beforeDestroy() {
    document.removeEventListener('mousedown', this.handleClickOutsideActionMenu);
  },
  methods: {
    ...mapActions(['reopenSuggestion', 'markAsDone']),
    getSuggestionStatus(id: string): SuggestionStatus | undefined {
      return this.$store.state.suggestionStatuses[id];
    },
    getItemIndexById(id: string): number {
      // This is needed if original handleAction relied on index for something other than identification
      // For simplicity, I've tried to remove reliance on raw index where possible
      return this.suggestions.findIndex((s) => s.id === id);
    },
    getCategoryStats(category: string): { high: number; medium: number } {
      const categoryItems = this.suggestions.filter(
        (item: Suggestion) => item.category === category && !this.getSuggestionStatus(item.id)
      );
      return {
        high: categoryItems.filter((item: Suggestion) => item.priority === 'high').length,
        medium: categoryItems.filter((item: Suggestion) => item.priority === 'medium').length,
      };
    },
    getCategoryIconComponent(category: string): Component | undefined {
      return getCategoryIconComponent(category);
    },
    openDetailsDialog(suggestion: Suggestion) {
      console.log(new Error().stack);
      this.selectedSuggestion = suggestion;
      this.showExplanation = false; // Reset explanation visibility
      // Mermaid diagram will be rendered by watcher if suggestion has one
    },
    handleDialogClose() {
      this.selectedSuggestion = undefined;
      this.showExplanation = false;
      // this.showFullDiagram = false; // If this state exists
    },
    dismissSuggestion(reason: string) {
      const id = this.showDismissDialogForSuggestionId;
      if (!reason || !id) return;

      this.$store.dispatch('dismissSuggestion', { id, reason });
      this.closeDismissDialog();
      this.selectedSuggestion = undefined;
    },
    handleFix(suggestion: Suggestion) {
      this.$root.$emit('fix', suggestion);
      // set fix status immediately to prevent the user from clicking multiple times
      this.$store.dispatch('fixInProgress', suggestion.id);
    },
    openDismissDialog(id: string) {
      this.showDismissDialogForSuggestionId = id;
    },
    closeDismissDialog() {
      this.showDismissDialogForSuggestionId = undefined;
    },
    isLoadingAction(id: string, action: 'apply' | 'explain'): boolean {
      return !!(this.isLoading && this.isLoading.id === id && this.isLoading.action === action);
    },
    async renderMermaidDiagram() {
      if (!this.selectedSuggestion?.runtime?.sequenceDiagram || !this.$refs.diagramContainerRef) {
        return;
      }
      // Ensure container is visible and in DOM
      this.$nextTick(async () => {
        const container = this.$refs.diagramContainerRef as HTMLDivElement;
        if (!container) return;
        try {
          // Generate a unique ID for each render if needed, or clear previous
          container.innerHTML = ''; // Clear previous diagram
          const { svg } = await mermaid.render(
            `mermaid-${this.selectedSuggestion!.id}-${Date.now()}`,
            this.selectedSuggestion!.runtime!.sequenceDiagram!
          );
          container.innerHTML = svg;
        } catch (error) {
          console.error('Failed to render Mermaid diagram:', error);
          container.innerHTML = 'Error rendering diagram.';
        }
      });
    },
    toggleActionMenu(suggestionId: string) {
      this.openActionMenu = this.openActionMenu === suggestionId ? undefined : suggestionId;
    },
    handleClickOutsideActionMenu(event: MouseEvent) {
      if (this.openActionMenu === null) return;

      const triggerRefName = `actionMenuTrigger-${this.openActionMenu}`;
      const dropdownRefName = `actionMenuDropdown-${this.openActionMenu}`;

      const triggerElement = this.$refs[triggerRefName] as HTMLElement | HTMLElement[] | undefined;
      const dropdownElement = this.$refs[dropdownRefName] as
        | HTMLElement
        | HTMLElement[]
        | undefined;

      const actualTrigger = Array.isArray(triggerElement) ? triggerElement[0] : triggerElement;
      const actualDropdown = Array.isArray(dropdownElement) ? dropdownElement[0] : dropdownElement;

      if (actualTrigger && actualTrigger.contains(event.target as Node)) {
        return; // Click was on the trigger, toggleActionMenu handles it
      }
      if (actualDropdown && actualDropdown.contains(event.target as Node)) {
        return; // Click was inside the dropdown
      }
      this.openActionMenu = undefined;
    },
    viewRecordingInstructions() {
      this.$root.$emit('view-recording-instructions');
    },
  },
});
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

// Helper classes from Tailwind that are frequently used
.mb-2 {
  margin-bottom: 0.5rem;
}
.mb-4 {
  margin-bottom: 1rem;
}
.mb-8 {
  margin-bottom: 2rem;
}
.mt-2 {
  margin-top: 0.5rem;
}
.mt-6 {
  margin-top: 1.5rem;
}
.pr-8 {
  padding-right: 2rem;
} // For modal title to not overlap close button
.mt-0 {
  margin-top: 0;
}

.icon {
  /* Common icon styling can be added here as needed */
  display: inline-block;
}

.inline-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

.success {
  stroke: $color-success;
}

.suggestions-loader,
.card-loader {
  width: 100%;
  height: 6rem;
  border-radius: $border-radius;
}

.category-stats {
  display: flex;
  gap: 0.5rem; // Tailwind gap-2
  align-items: center;
  margin-left: auto; // Align to the right

  .suggestion-count {
    padding: 0.125rem 0.5rem;

    &::after {
      margin-left: 0.25rem;
    }

    &.high {
      color: $color-error;
      &::after {
        content: 'high';
      }
    }
    &.medium {
      color: $color-warning;
      &::after {
        content: 'medium';
      }
    }
    &.low {
      color: $color-foreground;
      &::after {
        content: 'low';
      }
    }
  }
}

.suggestions-loader {
  height: 16rem;
}

// Summary Section
.summary-grid {
  display: grid;
  gap: 1rem; // Tailwind gap-4
  @media (min-width: 768px) {
    // Tailwind md:grid-cols-3
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.summary-card {
  background-color: $color-tile-background; // Tailwind bg-gray-800
  padding: 1rem; // Tailwind p-4
  border-radius: $border-radius-big;
  border: 1px solid $color-border; // Tailwind border-gray-700
  transition: $transition;
  text-decoration: none;
  color: $color-foreground;

  &:hover {
    border-color: rgba($color-highlight, 0.5); // Tailwind hover:border-blue-500/50
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 0.5rem; // Tailwind gap-2
    margin-bottom: 0.75rem; // Tailwind mb-3
    .icon {
      color: $color-foreground-secondary;
    }
  }

  &__title {
    font-size: 1.125rem; // Tailwind text-lg
    font-weight: 500; // Tailwind font-medium
    text-transform: capitalize;
    color: $color-foreground-light;
    margin: 0;
  }

  &__stats {
    display: flex;
    flex-direction: column;
    gap: 0.75em;

    p {
      font-size: $font-size; // Tailwind text-sm
      color: $color-foreground-secondary;
      margin: 0;
    }
    .priority-high-text {
      color: $color-error; // Tailwind text-red-400
      font-weight: 500;
    }
    .priority-medium-text {
      color: $color-warning; // Tailwind text-yellow-400
      font-weight: 500;
    }
  }
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem; // Tailwind gap-2
  margin-bottom: 1rem;

  .icon {
    color: $color-foreground-light;
  }
}

.category-title {
  font-size: 1.25rem; // Tailwind text-xl
  font-weight: 600; // Tailwind font-semibold
  text-transform: capitalize;
  color: $color-foreground-light;
  margin: 0;
}

// Suggestions Grid
.suggestions-grid {
  display: grid;
  gap: 1rem; // Tailwind gap-4
}

.reopen-button {
  background: none;
  border: none;
  color: $color-link; // Tailwind text-blue-400
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem; // Tailwind gap-1
  transition: $transition;
  padding: 0.25rem 0.5rem;
  border-radius: $border-radius;

  &:hover {
    color: $color-link-hover; // Tailwind hover:text-blue-300
    background-color: $color-background-light;
  }
  svg {
    margin-right: 0.25rem;
  }
}

.tag {
  padding: 0.125rem 0.5rem; // Tailwind px-2 py-0.5
  border-radius: $border-radius-big; // Tailwind rounded-full
  font-size: 0.75rem; // Tailwind text-xs
  font-weight: 500; // Tailwind font-medium

  &--runtime {
    background-color: rgba($color-highlight, 0.1); // Tailwind bg-blue-500/10
    color: $color-highlight-light; // Tailwind text-blue-400
  }
}

// Modal (Dialog) Styling
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(black, 0.5); // Tailwind bg-black/50
  backdrop-filter: blur(4px); // Tailwind backdrop-blur-sm
  z-index: 40; // Ensure it's above other content
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background-color: $color-background; // Tailwind bg-gray-900
  padding: 1.5rem; // Tailwind p-6
  border-radius: $border-radius-big;
  box-shadow: $shadow-tile; // Tailwind shadow-xl
  position: relative;
  max-height: 85vh;
  overflow-y: auto;
  color: $color-foreground;

  &.details-dialog {
    width: 90vw;
    max-width: 800px; // Tailwind max-w-[800px]
  }
  &.dismiss-dialog {
    width: 90vw;
    max-width: 500px; // Tailwind max-w-[500px]
  }
}

.modal-title {
  font-size: 1.25rem; // Tailwind text-xl
  font-weight: 600; // Tailwind font-semibold
  color: $color-foreground-light; // Tailwind text-white
  margin-bottom: 0.5rem; // Tailwind mb-2 (for title only) or mb-4
}

.modal-close-button {
  position: absolute;
  top: 1.5rem; // Tailwind top-6
  right: 1.5rem; // Tailwind right-6
  color: $color-foreground-secondary; // Tailwind text-gray-400
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  transition: $transition;
  &:hover {
    color: $color-foreground-light; // Tailwind hover:text-white
  }
}

// Dialog specific content
.dialog-actions {
  display: flex;
  gap: 0.5rem; // Tailwind gap-2
  align-items: center;
  // .mb-6 applied by utility class

  &--right {
    // For dismiss dialog buttons
    justify-content: flex-end;
  }
}

.info-block {
  // .mb-6 applied by utility class
  &__title {
    font-size: 0.875rem; // Tailwind text-sm
    font-weight: 500; // Tailwind font-medium
    color: $color-foreground-dark; // Tailwind text-gray-300
    margin-bottom: 0.5rem; // Tailwind mb-2
  }
  &__subtitle {
    // For stack trace, sequence diagram, explanation subheadings
    font-size: 0.875rem;
    font-weight: 500;
    color: $color-foreground-secondary; // Tailwind text-gray-400
    margin-bottom: 0.5rem;
  }
  &__code {
    font-size: 0.875rem;
    font-family: monospace;
    color: $color-foreground-secondary; // Tailwind text-gray-400
    word-break: break-all;
  }
}

.code-block {
  background-color: $color-tile-background; // Tailwind bg-gray-800
  padding: 1rem; // Tailwind p-4
  border-radius: $border-radius; // Tailwind rounded-lg
  overflow-x: auto;
  code {
    font-size: 0.875rem;
    font-family: monospace; // Tailwind font-mono
    color: $color-foreground-dark; // Tailwind text-gray-300
    white-space: pre;
  }
}

.diagram-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.diagram-container {
  background-color: $color-tile-background; // Tailwind bg-gray-800
  padding: 1rem; // Tailwind p-4
  border-radius: $border-radius; // Tailwind rounded-lg
  overflow-x: auto;
  // height auto, specific height if needed by showFullDiagram
  // min-height: 200px; // Example min height
  ::v-deep svg {
    // Style mermaid SVG if needed
    max-width: none !important; // Allow horizontal scrolling
  }
}

.explanation-block {
  padding: 1rem; // Tailwind p-4
  background-color: $color-tile-background; // Tailwind bg-gray-800
  border-radius: $border-radius; // Tailwind rounded-lg
  // .mt-6 applied by utility class
  p {
    font-size: 0.875rem;
    color: $color-foreground-secondary; // Tailwind text-gray-400
  }
}

// Form elements for Dismiss Dialog
.form-label {
  display: block;
  font-size: 0.875rem; // Tailwind text-sm
  font-weight: 500; // Tailwind font-medium
  color: $color-foreground-dark; // Tailwind text-gray-300
  margin-bottom: 0.5rem; // Tailwind mb-2
}
.form-textarea {
  width: 100%;
  min-height: 6rem; // Tailwind h-24
  background-color: $color-input-bg; // Tailwind bg-gray-800
  border: 1px solid $color-border; // Tailwind border-gray-700
  border-radius: $border-radius; // Tailwind rounded-lg
  padding: 0.75rem; // Tailwind p-3
  color: $color-input-fg; // Tailwind text-gray-300
  transition: $transition;
  font-family: $font-family;
  font-size: $font-size;

  &:focus {
    outline: none;
    border-color: $color-highlight; // Tailwind focus:border-blue-500
  }
  &::placeholder {
    color: $color-foreground-secondary;
  }
}
</style>
