<template>
  <div class="suggestion-card" data-cy="prompt-suggestion" @click="onClick">
    <v-pin class="pin" />
    <div class="title">{{ title }}</div>
    <div class="sub-title">{{ subTitle }}</div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VPin from '@/assets/map-pin.svg';

export default {
  name: 'v-suggestion-card',

  components: {
    VPin,
  },

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
  display: inline-grid;
  grid-template-columns: 32px 1fr;
  background-color: rgba(0, 0, 0, 0.4);
  padding: 1rem;
  row-gap: 0.5rem;
  color: #ececec;

  &:hover {
    cursor: pointer;
    background-color: rgba(255, 255, 255, 0.1);
    * {
      color: white !important;
    }
  }

  .pin {
    width: 32px;
    height: 32px;
    margin-bottom: -16px;
    border-radius: 50%;
    overflow: visible;
    margin-right: 1rem;
    grid-column: 1;
  }

  .title {
    font-weight: bold;
    grid-column: 2;
    margin-left: 1rem;
  }

  .sub-title {
    grid-column: 2;
    grid-row: 2;
    margin-left: 1rem;
    font-size: 0.8rem;
  }
}
</style>
