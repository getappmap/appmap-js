<template>
  <div class="mode-instruction-card" data-cy="mode-instruction" @click="onClick">
    <div class="title">
      {{ title }}
      <span class="default" v-if="isDefault">(default)</span>
    </div>
    <div class="sub-title">{{ subTitle }}</div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
export default {
  name: 'v-mode-instruction-card',

  props: {
    id: {
      required: true,
    },
    title: {
      required: true,
    },
    subTitle: {
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    onClick() {
      this.$emit('useMode', this.id);
    },
  },
};
</script>

<style lang="scss" scoped>
.mode-instruction-card {
  background-color: #2d3546;
  margin: 0.5rem 0;
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

    .default {
      color: $gray4;
    }
  }

  .sub-title {
    color: #9094a3;
    font-size: 0.8rem;
  }
}
</style>
