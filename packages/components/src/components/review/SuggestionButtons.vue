<template>
  <section class="buttons" :class="{ compact, [status.status]: true }">
    <v-button
      v-if="!done && !fixThread"
      :size="buttonSize"
      class="dim"
      kind="native-ghost"
      @click.native.stop="$emit('fix')"
      :title="compact ? 'Fix' : undefined"
    >
      <Wrench class="icon" :size="iconSize" />
      <span v-if="!compact">Fix</span>
    </v-button>
    <v-button
      kind="native-ghost"
      v-if="!done && fixThread"
      :size="buttonSize"
      class="dim"
      @click.native.stop="$root.$emit('show-navie-thread', fixThread)"
      :title="compact ? 'Show fix' : undefined"
    >
      <Wrench class="fix-icon icon" :size="iconSize" />
      <span v-if="!compact">Show fix</span>
    </v-button>
    <v-button
      kind="native-ghost"
      v-if="!done"
      :size="buttonSize"
      class="dim"
      @click.native.stop="$emit('done')"
      :title="compact ? 'Mark as done' : undefined"
    >
      <CircleCheck class="icon" :size="iconSize" />
      <span v-if="!compact">Mark as done</span>
    </v-button>
    <v-button
      kind="native-ghost"
      v-if="!done"
      :size="buttonSize"
      class="dim"
      @click.native.stop="$emit('dismiss')"
      :title="compact ? 'Dismiss' : undefined"
    >
      <Trash class="icon" :size="iconSize" />
      <span v-if="!compact">Dismiss</span>
    </v-button>
    <v-button
      kind="native-ghost"
      v-if="done"
      :size="buttonSize"
      class="dim"
      @click.native.stop="$emit('reopen')"
      :title="compact ? 'Reopen' : undefined"
    >
      <RotateCcw class="icon" :size="iconSize" />
      <span v-if="!compact">Reopen</span>
    </v-button>
  </section>
</template>

<script lang="ts">
import { Wrench, CircleCheck, Trash, RotateCcw } from 'lucide-vue';
import { defineComponent, type PropType } from 'vue';
import { SuggestionStatus } from '.';
import VButton from '@/components/Button.vue';

export default defineComponent({
  components: {
    Wrench,
    CircleCheck,
    Trash,
    RotateCcw,
    VButton,
  },
  props: {
    status: {
      type: Object as PropType<SuggestionStatus>,
      required: true,
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['fix', 'done', 'dismiss', 'reopen'],
  computed: {
    done(): boolean {
      return ['fixed', 'dismissed'].includes(this.status.status);
    },
    fixThread(): string | undefined {
      return this.status.threadId;
    },
    iconSize(): number {
      return this.compact ? 16 : 18;
    },
    buttonSize(): string {
      return this.compact ? 'small' : 'medium';
    },
  },
});
</script>

<style scoped lang="scss">
.compact {
  .icon {
    margin: 0;
  }
}

.fix-in-progress .fix-icon {
  animation: spin 1s linear infinite;
}

.fix-ready .fix-icon {
  animation: none;
  stroke: $color-success;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.icon {
  display: inline-block;
  vertical-align: middle;
  margin-right: 0.5rem;
}

.dim {
  opacity: 0.85;
  &:hover {
    opacity: 1;
  }
}
</style>
