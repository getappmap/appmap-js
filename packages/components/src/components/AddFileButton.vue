<template>
  <v-button class="clear add-file__button" size="small" kind="ghost">
    <PlusIcon />Add content...
  </v-button>
</template>

<script lang="ts">
//@ts-nocheck
import VButton from '@/components/Button.vue';
import PlusIcon from '../assets/plus.svg';

export default {
  name: 'v-chat-search',
  components: {
    VButton,
    PlusIcon,
  },
};
</script>

<style lang="scss" scoped>
.add-file__button {
  svg {
    width: 1rem;
    height: 1rem;
    margin-right: 0.63em;
    fill: $white;
  }
}

.clear {
  padding: 0.5rem 1rem;
  background-color: #262d3e;

  &:hover {
    background-color: darken(#262d3e, 10%);
  }
}
</style>
