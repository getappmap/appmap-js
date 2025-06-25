<script lang="ts">
import { Wrench, CircleCheck, Trash, RotateCcw } from 'lucide-vue';
import { defineComponent } from 'vue';

export default defineComponent({
  components: {
    Wrench,
    CircleCheck,
    Trash,
    RotateCcw,
  },
  props: {
    done: {
      type: Boolean,
      default: false,
    },
    compact: {
      type: Boolean,
      default: false,
    },
    fixThread: {
      type: String,
      required: false,
    },
  },
  emits: ['fix', 'done', 'dismiss', 'reopen'],
});
</script>

<template>
  <section class="buttons" :class="{ compact }">
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
      <Wrench :size="16" class="working" />
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

.working {
  animation: spin 1s linear infinite;
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
