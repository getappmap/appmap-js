<template>
  <v-button class="add-file__button" size="small" kind="ghost">
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
  padding: 0.5rem 1rem;
  transition-duration: 0.25s;

  &:hover {
    background-color: rgba(white, 0.05);
  }

  &:active {
    background-color: rgba(white, 0.2);
  }

  svg {
    width: 1rem;
    height: 1rem;
    margin-right: 0.63em;
    fill: $white;
  }
}
</style>
