<script lang="ts">
import { Wrench, CircleCheck, Trash, RotateCcw } from 'lucide-vue';
import { defineComponent, type PropType } from 'vue';
import { SuggestionStatus } from '.';

export default defineComponent({
  components: {
    Wrench,
    CircleCheck,
    Trash,
    RotateCcw,
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
      console.log(this.status);
      return this.status.threadId;
    },
  },
});
</script>

<template>
  <section class="buttons" :class="{ compact, [status.status]: true }">
    <button
      v-if="!done && !fixThread"
      @click.stop="$emit('fix')"
      :title="compact ? 'Fix' : undefined"
    >
      <Wrench :size="16" />
      <span v-if="!compact">Fix</span>
    </button>
    <button
      v-if="!done && fixThread"
      @click.stop="$root.$emit('show-navie-thread', fixThread)"
      :title="compact ? 'Show fix' : undefined"
    >
      <Wrench :size="16" class="fix-icon" />
      <span v-if="!compact">Show fix</span>
    </button>
    <button v-if="!done" @click.stop="$emit('done')" :title="compact ? 'Mark as done' : undefined">
      <CircleCheck :size="16" />
      <span v-if="!compact">Mark as done</span>
    </button>
    <button v-if="!done" @click.stop="$emit('dismiss')" :title="compact ? 'Dismiss' : undefined">
      <Trash :size="16" />
      <span v-if="!compact">Dismiss</span>
    </button>
    <button v-if="done" @click.stop="$emit('reopen')" :title="compact ? 'Reopen' : undefined">
      <RotateCcw :size="16" />
      <span v-if="!compact">Reopen</span>
    </button>
  </section>
</template>

<style scoped lang="scss">
.compact svg {
  stroke: $color-highlight;
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
</style>
