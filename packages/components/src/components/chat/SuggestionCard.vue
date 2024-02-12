<template>
  <div class="suggestion-card" data-cy="prompt-suggestion" @click="onClick">
    <div class="title">{{ title }}</div>
    <div class="sub-title">{{ subTitle }}</div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
export default {
  name: 'v-suggestion-card',

  props: {
    title: {
      required: true,
    },
    subTitle: {
      required: true,
    },
    prompt: {
      required: true,
    },
  },

  methods: {
    onClick() {
      this.$emit('suggest', this.prompt);
    },
  },
};
</script>

<style lang="scss" scoped>
.suggestion-card {
  background-color: #2d3546;
  padding: 1rem 2rem;
  color: #e3e5e8;
  width: 100%;
  box-shadow: 0 0 0.7rem 0rem darken(#2d3546, 7%);
  box-sizing: border-box;

  &:hover {
    cursor: pointer;
    background-color: rgba(255, 255, 255, 0.1);
    transition: $transition;
    * {
      color: white !important;
      transition: $transition;
    }
  }

  .title {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .sub-title {
    color: #9094a3;
    font-size: 0.8rem;
  }
}
</style>
