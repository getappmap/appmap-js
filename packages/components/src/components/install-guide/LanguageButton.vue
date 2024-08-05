<template>
  <div class="language-button" data-cy="language-button" :data-language="language.toLowerCase()">
    <div class="language-button__name">{{ language }}</div>
    <div class="language-button__icon">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    language: String,
  },
});
</script>

<style scoped lang="scss">
.language-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: fit-content;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  color: white;
  font-weight: bold;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.25);
  gap: 0.5rem;

  &:hover {
    background-color: rgba(255, 255, 255, 0.75);
    border-color: white;
    color: black;
    * > svg path[fill] {
      fill: black;
    }
    * > svg path[stroke] {
      stroke: black;
    }
  }

  &__icon {
    fill: currentColor;
  }
}
</style>
