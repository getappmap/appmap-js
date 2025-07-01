<template>
  <v-badge>
    <component :is="iconInfo.component" :class="iconInfo.class" :size="10" />
    {{ type }}
  </v-badge>
</template>

<script lang="ts">
import Vue, { Component } from 'vue';
import { Shield, Gauge, PencilLine, Shapes } from 'lucide-vue';
import VBadge from '@/components/Badge.vue';

type IconInfo = {
  component: Component;
  class: string;
};
const TypeIcons: Record<string, IconInfo> = {
  security: {
    component: Shield,
    class: 'full icon-adjust',
  },
  performance: {
    component: Gauge,
    class: 'icon-adjust',
  },
  style: {
    component: PencilLine,
    class: 'icon-adjust',
  },
  default: {
    component: Shapes,
    class: 'icon-adjust',
  },
};

export default Vue.extend({
  components: {
    VBadge,
    Shield,
    Gauge,
    PencilLine,
    Shapes,
  },
  props: {
    type: {
      type: String,
      required: true,
    },
  },
  computed: {
    typeClass(): string {
      return `type-${this.type.toLowerCase()}`;
    },
    iconInfo(): IconInfo {
      const info = TypeIcons[this.type.toLowerCase()];
      return info ?? TypeIcons.default;
    },
  },
});
</script>

<style scoped lang="scss">
.full {
  fill: currentColor;
}

.icon-adjust {
  transform: translateY(1px);
  padding-right: 0.15rem;
}
</style>
