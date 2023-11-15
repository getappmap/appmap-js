<template>
  <div class="message">
    <div class="avatar">
      <!-- <img :src="avatar" /> -->
      <v-appmap-logo />
    </div>
    <div class="name">{{ name }}</div>
    <div class="message__body">
      <div class="message__text">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
//@ts-ignore
import VAppmapLogo from '@/assets/appmap-logomark.svg';

export default {
  name: 'v-user-message',

  components: {
    VAppmapLogo,
  },

  props: {
    avatar: {
      required: true,
    },
    name: {
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.message {
  display: grid;
  grid-template-columns: 32px 1fr;
  grid-template-rows: 32px 1fr;
  background-color: $gray2;
  padding: 1rem;

  .avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 1rem;
    grid-column: 1;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  .name {
    color: $gray4;
    font-weight: bold;
    grid-column: 2;
    margin-left: 1rem;
  }

  &__body {
    color: $gray4;
    grid-column: 2;
    grid-row: 2;
    margin-left: 1rem;
  }
}
</style>
