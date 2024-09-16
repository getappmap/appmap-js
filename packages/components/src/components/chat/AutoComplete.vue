<template>
  <v-popper
    :arrow="false"
    :hoverable="false"
    align="left"
    placement="top"
    ref="autocomplete"
    class="autocomplete"
  >
    <template #content>
      <ul data-cy="autocomplete">
        <li
          v-for="(command, i) in autoCompletions"
          :key="i"
          :class="{ selected: i === selectionIndex }"
          data-cy="autocomplete-item"
          @click.prevent="onSubmitCompletion(command.name)"
          @mouseover.prevent="selectionIndex = i"
        >
          <div class="command">
            <b :data-active="selectionIndex === i">{{ command.name }}</b>
          </div>
          <span class="description">{{ command.description }}</span>
        </li>
      </ul>
    </template>
  </v-popper>
</template>

<script lang="ts">
import Vue from 'vue';
import VPopper from '@/components/Popper.vue';
import { NavieRpc } from '@appland/rpc';

type PopperRef = Vue & { show: () => void; hide: () => void; isVisible: Readonly<boolean> };

export default Vue.extend({
  name: 'v-auto-complete',

  components: {
    VPopper,
  },

  props: {
    input: {
      type: String,
      required: true,
    },
    commands: {
      type: Array as () => NavieRpc.V1.Metadata.Command[],
      default: () => [],
    },
  },

  data() {
    return {
      caretOffset: undefined as number | undefined,
      selectionIndex: 0,
      onInput: (() => {}) as (e: KeyboardEvent) => void,
      onCaretChange: () => {},
    };
  },

  watch: {
    autoCompletions(val) {
      if (val.length) {
        this.onDisplay();
      } else {
        this.onHide();
      }
    },
    input: {
      immediate: true,
      handler() {
        this.onCaretChange();
      },
    },
  },

  computed: {
    popperRef(): PopperRef | undefined {
      return this.$refs.autocomplete as PopperRef | undefined;
    },
    activeToken(): string | undefined {
      if (!this.commands.length || !this.caretOffset || !this.input) return undefined;

      // Don't consider any other token but the first. Commands are always at the beginning of the
      // input.
      const firstTokenBoundary = this.input.match(/\s|$/)?.index;
      if (firstTokenBoundary && this.caretOffset > firstTokenBoundary) return undefined;

      // Find an index to the end of the token the cursor is on
      const tokenEnd = this.input.slice(this.caretOffset).match(/\s|$/);

      // Calculate the index of the end of the token
      let endIndex = this.caretOffset;
      if (tokenEnd) endIndex += tokenEnd?.index ?? 0;

      // activeText is the string from the start of the input to the cursor
      const activeText = this.input.slice(0, endIndex);

      // We need the word the cursor is on, so we split on whitespace and take the last token
      const tokens = activeText.split(/\s+/);
      return tokens[tokens.length - 1];
    },
    autoCompletions(): NavieRpc.V1.Metadata.Command[] {
      if (!this.activeToken) return [];
      return this.commands.filter(
        ({ name }) => name !== this.activeToken && name.startsWith(this.activeToken!)
      );
    },
    isVisible(): boolean {
      return this.popperRef?.isVisible ?? false;
    },
  },

  methods: {
    onDisplay() {
      this.selectionIndex = 0;
      this.popperRef?.show();
      window.addEventListener('keydown', this.onInput);
    },
    onHide() {
      this.popperRef?.hide();
      window.removeEventListener('keydown', this.onInput);
    },
    onSubmitCompletion(command: string) {
      this.onHide();
      if (command) this.$emit('submit', command);
    },
  },

  mounted() {
    this.onInput = (e: KeyboardEvent) => {
      if (!this.popperRef?.isVisible) return;

      switch (e.key) {
        case 'ArrowUp':
          this.selectionIndex = Math.max(0, this.selectionIndex - 1);
          e.preventDefault();
          break;

        case 'ArrowDown':
          this.selectionIndex = Math.min(this.autoCompletions.length - 1, this.selectionIndex + 1);
          e.preventDefault();
          break;

        case 'Tab':
        case 'Enter': {
          if (this.autoCompletions.length > 0) {
            const { name } = this.autoCompletions[this.selectionIndex];
            this.onSubmitCompletion(name);
          }

          e.preventDefault();
          break;
        }

        case 'Escape':
          this.onHide();
          e.preventDefault();
          break;

        default:
          return;
      }
    };

    this.onCaretChange = () => {
      const selection = document.getSelection();
      this.caretOffset = selection?.focusOffset;
    };

    document.addEventListener('selectionchange', this.onCaretChange);
  },

  destroyed() {
    document.removeEventListener('selectionchange', this.onCaretChange);
  },
});
</script>

<style lang="scss" scoped>
.autocomplete {
  right: inherit;
  left: 0;
  z-index: 100;
  bottom: inherit !important;

  &::v-deep {
    .popper__text {
      background-color: $black;
    }
  }

  ul {
    padding-inline-start: 0;
    margin: 0;
    list-style-type: none;
    pointer-events: initial !important;
    user-select: none;

    li.selected {
      background-color: rgba($color: $white, $alpha: 0.1);
    }

    li {
      cursor: pointer;
      padding: 0.5rem;
    }
  }
}
</style>
