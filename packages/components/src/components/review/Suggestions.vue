<template>
  <section id="suggestions" class="suggestions-section">
    <div class="container">
      <SectionHeading title="Suggestions" />

      <!-- Summary -->
      <div class="summary-grid mb-8">
        <a
          v-for="category in summaryCategories"
          :key="category.name"
          :href="`#${category.name}-suggestions`"
          class="summary-card"
          :class="{ 'has-issues': category.stats.high > 0 || category.stats.medium > 0 }"
        >
          <div class="summary-card__header">
            <component :is="getCategoryIconComponent(category.name)" :size="20" class="icon" />
            <h3 class="summary-card__title">{{ category.name }}</h3>
          </div>
          <div class="summary-card__stats">
            <p class="text-sm">
              High Priority: <span class="priority-high-text">{{ category.stats.high }}</span>
            </p>
            <p class="text-sm">
              Medium Priority: <span class="priority-medium-text">{{ category.stats.medium }}</span>
            </p>
          </div>
        </a>
      </div>

      <!-- Suggestions by category -->
      <div
        v-for="(items, category) in categorizedSuggestions"
        :key="category"
        :id="`${category}-suggestions`"
        class="category-section mb-12"
      >
        <div class="category-header mb-6">
          <component :is="getCategoryIconComponent(category)" :size="24" class="icon" />
          <h3 class="category-title">{{ category }}</h3>
        </div>

        <div class="suggestions-grid">
          <div
            v-for="(suggestion, index) in items"
            :key="index"
            class="suggestion-card"
            :class="{ 'is-dismissed': findDismissedSuggestion(suggestion.id) }"
          >
            <div class="suggestion-card__content">
              <div class="suggestion-card__main">
                <div class="suggestion-card__title-area">
                  <CheckCircleIcon
                    v-if="findDismissedSuggestion(suggestion.id)"
                    :size="20"
                    :class="getStatusClass(findDismissedSuggestion(suggestion.id).status)"
                  />
                  <component
                    v-else
                    :is="getCategoryIconComponent(suggestion.category)"
                    :size="20"
                    class="icon"
                  />
                  <h4 class="suggestion-card__title">{{ suggestion.title }}</h4>
                  <span v-if="suggestion.runtime" class="tag tag--runtime">Runtime</span>
                </div>
                <div class="suggestion-card__meta mt-2">
                  <span class="meta-item type">{{ suggestion.type }}</span>
                  <span class="tag" :class="getPriorityClass(suggestion.priority)">
                    {{ suggestion.priority }}
                  </span>
                  <code class="meta-item location">{{ suggestion.location }}</code>
                </div>

                <div
                  v-if="findDismissedSuggestion(suggestion.id)"
                  class="suggestion-card__status mt-2"
                >
                  <span :class="getStatusClass(findDismissedSuggestion(suggestion.id).status)">
                    {{ getStatusText(findDismissedSuggestion(suggestion.id).status) }}
                  </span>
                  <button @click="handleReopen(suggestion.id)" class="reopen-button">
                    <RotateCcwIcon :size="16" />
                    Reopen
                  </button>
                </div>
              </div>
              <div class="suggestion-card__actions">
                <div v-if="!findDismissedSuggestion(suggestion.id)" class="action-menu-container">
                  <button
                    @click.stop="toggleActionMenu(suggestion.id)"
                    :ref="`actionMenuTrigger-${suggestion.id}`"
                    class="action-menu-button"
                  >
                    <MoreVerticalIcon :size="20" />
                  </button>
                  <div
                    v-if="openActionMenu === suggestion.id"
                    class="action-menu-dropdown"
                    :ref="`actionMenuDropdown-${suggestion.id}`"
                  >
                    <button
                      @click="handleAction('apply', suggestion, index)"
                      :disabled="isLoadingAction(suggestion.id, 'apply')"
                      class="action-menu-item"
                    >
                      <Loader2Icon
                        v-if="isLoadingAction(suggestion.id, 'apply')"
                        :size="16"
                        class="animate-spin"
                      />
                      <WrenchIcon v-else :size="16" />
                      Apply Fix
                    </button>
                    <button
                      @click="handleAction('explain', suggestion, index)"
                      class="action-menu-item"
                    >
                      <HelpCircleIcon :size="16" /> Explain
                    </button>
                    <button
                      @click="handleAction('todo', suggestion, index)"
                      class="action-menu-item"
                    >
                      <FileCodeIcon :size="16" /> Add TODO
                    </button>
                    <button
                      @click="handleAction('fixed', suggestion, index)"
                      class="action-menu-item"
                    >
                      <CheckIcon :size="16" /> Mark Fixed
                    </button>
                    <button
                      @click="handleAction('dismissed', suggestion, index)"
                      class="action-menu-item"
                    >
                      <TrashIcon :size="16" /> Dismiss
                    </button>
                  </div>
                </div>
                <VButton variant="primary" @click="openDetailsDialog(suggestion, suggestion.id)">
                  Details
                </VButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Dialog -->
    <div v-if="selectedSuggestion" class="modal-overlay" @click.self="handleDialogClose">
      <div class="modal-content details-dialog">
        <template v-if="selectedSuggestion">
          <h3 class="modal-title pr-8">{{ selectedSuggestion.title }}</h3>
          <button @click="handleDialogClose" class="modal-close-button">
            <XIcon :size="20" />
          </button>

          <div class="suggestion-card__meta mb-4">
            <span class="meta-item type">{{ selectedSuggestion.type }}</span>
            <span class="tag" :class="getPriorityClass(selectedSuggestion.priority)">
              {{ selectedSuggestion.priority }}
            </span>
            <span v-if="selectedSuggestion.runtime" class="tag tag--runtime">Runtime</span>
          </div>

          <div
            class="dialog-actions mb-6"
            v-if="selectedSuggestionId !== null && !findDismissedSuggestion(selectedSuggestionId)"
          >
            <VPopper content="Apply Fix" placement="top">
              <template #trigger>
                <VButton
                  @click="
                    handleAction(
                      'apply',
                      selectedSuggestion,
                      getItemIndexById(selectedSuggestionId)
                    )
                  "
                  :loading="isLoadingAction(selectedSuggestionId, 'apply')"
                  variant="primary"
                >
                  <WrenchIcon :size="16" />
                </VButton>
              </template>
            </VPopper>
            <VPopper content="Explain" placement="top">
              <template #trigger>
                <VButton
                  @click="
                    handleAction(
                      'explain',
                      selectedSuggestion,
                      getItemIndexById(selectedSuggestionId)
                    )
                  "
                  :loading="isLoadingAction(selectedSuggestionId, 'explain')"
                >
                  <HelpCircleIcon :size="16" />
                </VButton>
              </template>
            </VPopper>
            <VPopper content="Add TODO" placement="top">
              <template #trigger>
                <VButton
                  @click="
                    handleAction('todo', selectedSuggestion, getItemIndexById(selectedSuggestionId))
                  "
                >
                  <FileCodeIcon :size="16" />
                </VButton>
              </template>
            </VPopper>
            <VPopper content="Mark Fixed" placement="top">
              <template #trigger>
                <VButton
                  @click="
                    handleAction(
                      'fixed',
                      selectedSuggestion,
                      getItemIndexById(selectedSuggestionId)
                    )
                  "
                >
                  <CheckIcon :size="16" />
                </VButton>
              </template>
            </VPopper>
            <VPopper content="Dismiss" placement="top">
              <template #trigger>
                <VButton
                  @click="
                    handleAction(
                      'dismissed',
                      selectedSuggestion,
                      getItemIndexById(selectedSuggestionId)
                    )
                  "
                >
                  <TrashIcon :size="16" />
                </VButton>
              </template>
            </VPopper>
          </div>

          <div class="info-block mb-6">
            <h4 class="info-block__title">Location</h4>
            <code class="info-block__code">{{ selectedSuggestion.location }}</code>
          </div>

          <div class="info-block mb-6">
            <h4 class="info-block__title">Code</h4>
            <pre
              class="code-block"
            ><code class="font-mono">{{ selectedSuggestion.code }}</code></pre>
          </div>

          <div v-if="selectedSuggestion.runtime" class="info-block mb-6">
            <h4 class="info-block__title">Runtime Analysis</h4>
            <div v-if="selectedSuggestion.runtime.stackTrace" class="mb-4">
              <h5 class="info-block__subtitle">Stack Trace</h5>
              <pre
                class="code-block"
              ><code class="font-mono">{{ selectedSuggestion.runtime.stackTrace }}</code></pre>
            </div>
            <div v-if="selectedSuggestion.runtime.sequenceDiagram">
              <div class="diagram-header">
                <h5 class="info-block__subtitle">Sequence Diagram</h5>
                <!-- Maximize button could be added here if needed -->
              </div>
              <div class="diagram-container" ref="diagramContainerRef">
                <!-- Mermaid diagram renders here -->
              </div>
            </div>
          </div>

          <div v-if="showExplanation" class="explanation-block mt-6">
            <h4 class="info-block__subtitle">Explanation</h4>
            <p>This is a detailed explanation of the issue and its potential impact...</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Dismiss Dialog -->
    <div
      v-if="showDismissDialogForSuggestionId !== null"
      class="modal-overlay"
      @click.self="closeDismissDialog"
    >
      <div class="modal-content dismiss-dialog">
        <h3 class="modal-title">Dismiss Suggestion</h3>
        <button @click="closeDismissDialog" class="modal-close-button">
          <XIcon :size="20" />
        </button>

        <div class="mb-6">
          <label for="dismiss-reason" class="form-label">Reason for dismissal</label>
          <textarea
            id="dismiss-reason"
            v-model="dismissReason"
            class="form-textarea"
            placeholder="Enter the reason for dismissing this suggestion..."
          />
        </div>

        <div class="dialog-actions--right">
          <VButton @click="closeDismissDialog" variant="secondary">Cancel</VButton>
          <VButton @click="confirmDismissal" :disabled="!dismissReason.trim()" variant="primary">
            Confirm
          </VButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import Vue, { Component, PropType } from 'vue';
import mermaid from 'mermaid';

// Icon Imports (assuming a library like vue-lucide-icons or similar)
// Replace with your actual icon components
import {
  AlertTriangle,
  Database,
  Globe,
  X,
  CheckCircle,
  Wrench,
  HelpCircle,
  FileCode,
  Check,
  RotateCcw,
  Loader2,
  Trash,
  MoreVertical,
  Maximize2,
} from 'lucide-vue'; // Adjust this import

import SectionHeading from './SectionHeading.vue';
import VButton from '@/components/Button.vue'; // Assuming VButton path
import VPopper from '@/components/Popper.vue'; // Assuming VPopper path

interface Suggestion {
  id: string; // Added an ID for more robust keying and state management
  title: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  location: string;
  code: string;
  category: 'security' | 'sql' | 'http';
  runtime?: {
    stackTrace?: string;
    sequenceDiagram?: string;
  };
}

interface DismissedSuggestion {
  id: string; // Use ID
  reason: string;
  status?: 'applied' | 'todo' | 'fixed' | 'dismissed';
}

// Add unique IDs to suggestions if they don't have them
// This is important for v-for keys and managing dismissed state robustly
// const rawSuggestions = (parse(suggestionYaml) as { suggestions: Omit<Suggestion, 'id'>[] })
//   .suggestions;
// const processedSuggestions: Suggestion[] = rawSuggestions.map((s, index) => ({
//   ...s,
//   id: `${s.category}-${s.title.replace(/\s+/g, '-')}-${index}`, // Simple unique ID generation
// }));

export default Vue.extend({
  name: 'SuggestionsList',
  components: {
    SectionHeading,
    VButton,
    VPopper,
    AlertTriangle,
    Database,
    Globe,
    X,
    CheckCircle,
    Wrench,
    HelpCircle,
    FileCode,
    Check,
    RotateCcw,
    Loader2,
    Trash,
    MoreVertical,
    Maximize2,
  },
  props: {
    suggestions: {
      type: Array as PropType<Suggestion[]>,
      default: () => [],
    },
    onSuggestionDismiss: {
      type: Function as PropType<(id: string) => void>, // Changed to ID
      required: true,
    },
  },
  data() {
    return {
      selectedSuggestion: null as Suggestion | null,
      selectedSuggestionId: null as string | null, // Store ID instead of index
      showDismissDialogForSuggestionId: null as string | null, // Store ID
      dismissReason: '',
      dismissedSuggestions: [] as DismissedSuggestion[],
      showExplanation: false,
      isLoading: null as { id: string; action: 'apply' | 'explain' } | null, // Use ID
      openActionMenu: null as string | null, // Store ID of suggestion whose menu is open
      // diagramContainerRef is handled by this.$refs
    };
  },
  computed: {
    summaryCategories(): { name: string; stats: { high: number; medium: number } }[] {
      return (['security', 'sql', 'http'] as const).map((category) => ({
        name: category,
        stats: this.getCategoryStats(category),
      }));
    },
    categorizedSuggestions(): Record<string, Suggestion[]> {
      return this.suggestions.reduce((acc: Record<string, Suggestion[]>, suggestion) => {
        if (!acc[suggestion.category]) {
          acc[suggestion.category] = [];
        }
        acc[suggestion.category].push(suggestion);
        return acc;
      }, {});
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
    findDismissedSuggestion(id: string): DismissedSuggestion | undefined {
      return this.dismissedSuggestions.find((ds) => ds.id === id);
    },
    getItemIndexById(id: string): number {
      // This is needed if original handleAction relied on index for something other than identification
      // For simplicity, I've tried to remove reliance on raw index where possible
      return this.suggestions.findIndex((s) => s.id === id);
    },
    getCategoryStats(category: string): { high: number; medium: number } {
      const categoryItems = this.suggestions.filter(
        (item: Suggestion) => item.category === category && !this.findDismissedSuggestion(item.id)
      );
      return {
        high: categoryItems.filter((item: Suggestion) => item.priority === 'high').length,
        medium: categoryItems.filter((item: Suggestion) => item.priority === 'medium').length,
      };
    },
    getCategoryIconComponent(category: string): Component | undefined {
      switch (category) {
        case 'security':
          return AlertTriangle;
        case 'sql':
          return Database;
        case 'http':
          return Globe;
        default:
          return undefined; // Or a default icon
      }
    },
    getPriorityClass(priority: string): string[] {
      switch (priority) {
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
    getStatusClass(status?: string): string[] {
      switch (status) {
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
    getStatusText(status?: string): string {
      switch (status) {
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
    openDetailsDialog(suggestion: Suggestion, id: string) {
      this.selectedSuggestion = suggestion;
      this.selectedSuggestionId = id;
      this.showExplanation = false; // Reset explanation visibility
      // Mermaid diagram will be rendered by watcher if suggestion has one
    },
    handleDialogClose() {
      this.selectedSuggestion = null;
      this.selectedSuggestionId = null;
      this.showExplanation = false;
      // this.showFullDiagram = false; // If this state exists
    },
    async handleAction(
      action: 'apply' | 'explain' | 'todo' | 'fixed' | 'dismissed',
      suggestion: Suggestion,
      itemIndex: number /* original index for onSuggestionDismiss if it strictly needs it */
    ) {
      this.openActionMenu = null; // Close action menu
      const suggestionId = suggestion.id;

      if (action === 'apply' || action === 'explain') {
        this.isLoading = { id: suggestionId, action };
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

        if (this.isLoading && this.isLoading.id === suggestionId) {
          // Check if still relevant
          if (action === 'explain') {
            this.showExplanation = true;
            // If 'explain' happens outside main dialog, ensure it's open
            if (!this.selectedSuggestion || this.selectedSuggestion.id !== suggestionId) {
              this.openDetailsDialog(suggestion, suggestionId);
            }
          } else {
            // 'apply'
            this.dismissedSuggestions = [
              ...this.dismissedSuggestions,
              { id: suggestionId, reason: 'Fix applied automatically', status: 'applied' },
            ];
            this.onSuggestionDismiss(suggestionId); // Use ID
            if (this.selectedSuggestionId === suggestionId) this.handleDialogClose(); // Close dialog if applied from within
          }
        }
        this.isLoading = null;
      } else if (action === 'dismissed') {
        this.showDismissDialogForSuggestionId = suggestionId;
      } else {
        // 'todo' or 'fixed'
        const reason = action === 'todo' ? 'Added to TODO list' : 'Marked as fixed';
        this.dismissedSuggestions = [
          ...this.dismissedSuggestions,
          { id: suggestionId, reason, status: action },
        ];
        this.onSuggestionDismiss(suggestionId); // Use ID
        if (this.selectedSuggestionId === suggestionId) this.handleDialogClose(); // Close dialog if actioned from within
      }
    },
    confirmDismissal() {
      const reason = this.dismissReason.trim();
      if (reason && this.showDismissDialogForSuggestionId !== null) {
        const idToDismiss = this.showDismissDialogForSuggestionId;
        this.dismissedSuggestions = [
          ...this.dismissedSuggestions,
          { id: idToDismiss, reason, status: 'dismissed' },
        ];
        this.onSuggestionDismiss(idToDismiss);
        this.closeDismissDialog();
        if (this.selectedSuggestionId === idToDismiss) this.handleDialogClose();
      }
    },
    closeDismissDialog() {
      this.showDismissDialogForSuggestionId = null;
      this.dismissReason = '';
    },
    handleReopen(id: string) {
      this.dismissedSuggestions = this.dismissedSuggestions.filter((ds) => ds.id !== id);
      // Potentially emit an event like this.$emit('suggestion-reopened', id) if parent needs to know
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
      this.openActionMenu = this.openActionMenu === suggestionId ? null : suggestionId;
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
      this.openActionMenu = null;
    },
  },
});
</script>

<style scoped lang="scss">
// General Container and Section
.suggestions-section {
  background-color: $color-background; // Tailwind bg-gray-900
  color: $color-foreground;
  padding: 2.5rem 0; // Tailwind py-10
}

.container {
  max-width: $max-width;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem; // Tailwind px-4
  padding-right: 1rem;
}

// Helper classes from Tailwind that are frequently used
.mb-2 {
  margin-bottom: 0.5rem;
}
.mb-4 {
  margin-bottom: 1rem;
}
.mb-6 {
  margin-bottom: 1.5rem;
}
.mb-8 {
  margin-bottom: 2rem;
}
.mb-12 {
  margin-bottom: 3rem;
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

.icon {
  // Common icon styling if needed
  // display: inline-block;
  // vertical-align: middle;
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

  &.has-issues {
    border-color: rgba($color-warning, 0.5); // Tailwind border-yellow-500/50
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
  }

  &__stats {
    p {
      font-size: $font-size; // Tailwind text-sm
      color: $color-foreground-secondary;
      &:not(:last-child) {
        margin-bottom: 0.25rem; // Tailwind space-y-1
      }
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

// Category Section
.category-section {
  // .mb-12 applied by utility class
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem; // Tailwind gap-2
  // .mb-6 applied by utility class
  .icon {
    color: $color-foreground-light;
  }
}

.category-title {
  font-size: 1.25rem; // Tailwind text-xl
  font-weight: 600; // Tailwind font-semibold
  text-transform: capitalize;
  color: $color-foreground-light;
}

// Suggestions Grid
.suggestions-grid {
  display: grid;
  gap: 1rem; // Tailwind gap-4
}

.suggestion-card {
  background-color: $color-tile-background; // Tailwind bg-gray-800
  padding: 1rem; // Tailwind p-4
  border-radius: $border-radius-big;
  border: 1px solid $color-border; // Tailwind border-gray-700
  transition: $transition;

  &:hover:not(.is-dismissed) {
    // Don't highlight dismissed cards on hover
    border-color: rgba($color-highlight, 0.5); // Tailwind hover:border-blue-500/50
  }

  &.is-dismissed {
    opacity: 0.7; // Dim dismissed cards slightly
    // Potentially different border or background
  }

  &__content {
    display: flex;
    align-items: flex-start; // Tailwind items-start
    justify-content: space-between; // Tailwind justify-between
    gap: 1rem; // Tailwind gap-4
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
    color: $color-foreground-light; // Tailwind text-white
    font-weight: 500; // Tailwind font-medium
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem; // Tailwind gap-2
    align-items: center;
    font-size: 0.875rem; // Tailwind text-sm
    // .mt-2 applied by utility class

    .meta-item {
      color: $color-foreground-secondary; // Tailwind text-gray-400
      &.location {
        font-family: monospace; // Tailwind font-mono
        color: $color-link; // Tailwind text-blue-400
        cursor: pointer;
        transition: $transition;
        &:hover {
          color: $color-link-hover; // Tailwind hover:text-blue-300
        }
      }
    }
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    // .mt-2 applied by utility class
  }
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

// Priority and Status classes from getPriorityClass / getStatusClass
.priority-high {
  color: $color-error;
  background-color: rgba($color-error, 0.1);
}
.priority-medium {
  color: $color-warning;
  background-color: rgba($color-warning, 0.1);
}
.priority-low {
  color: $color-foreground-light;
  background-color: rgba($color-foreground-light, 0.1);
}
.priority-default {
  color: $color-foreground-secondary;
  background-color: rgba($color-foreground-secondary, 0.1);
}

.status-applied {
  color: $color-success !important;
} // Tailwind text-green-400
.status-todo {
  color: $color-warning !important;
} // Tailwind text-yellow-400
.status-fixed {
  color: $color-highlight-light !important;
} // Tailwind text-blue-400
.status-dismissed {
  color: $color-foreground-secondary !important;
} // Tailwind text-gray-400
.status-unknown {
  color: $color-foreground-secondary !important;
}

// Action Menu (dropdown)
.action-menu-container {
  position: relative;
}
.action-menu-button {
  padding: 0.5rem; // Tailwind p-2
  color: $color-foreground-secondary; // Tailwind text-gray-400
  border-radius: $border-radius; // Tailwind rounded-lg
  transition: $transition;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: $color-foreground-light; // Tailwind hover:text-gray-200
    background-color: $color-background-dark; // Tailwind hover:bg-gray-700
  }
}

.action-menu-dropdown {
  position: absolute;
  right: 0;
  margin-top: 0.5rem; // Tailwind mt-2
  width: 12rem; // Tailwind w-48
  background-color: $color-tile-background; // Tailwind bg-gray-800
  border-radius: $border-radius; // Tailwind rounded-lg
  box-shadow: $shadow-tile; // Tailwind shadow-lg
  padding: 0.25rem 0; // Tailwind py-1
  z-index: 10;
  border: 1px solid $color-border; // Tailwind border-gray-700
}

.action-menu-item {
  width: 100%;
  padding: 0.5rem 1rem; // Tailwind px-4 py-2
  text-align: left;
  color: $color-foreground-light; // Tailwind text-gray-200
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem; // Tailwind gap-2
  transition: $transition;
  font-size: $font-size;

  &:hover {
    background-color: $color-background-dark; // Tailwind hover:bg-gray-700
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

// Suggestion card specific actions (buttons on the right)
.suggestion-card__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem; // Tailwind gap-2

  .v-button {
    // Assuming VButton is your component
    // Default styling comes from VButton, overrides here if needed
    // Example: Tailwind px-4 py-2 text-white rounded-lg hover:bg-blue-600
    // This should be handled by VButton variant="primary" ideally
  }
}
</style>
