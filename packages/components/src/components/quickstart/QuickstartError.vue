<template>
  <div class="qs-error">
    <span class="qs-error__title">{{ message }}</span>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'QuickstartLoader',

  props: {
    code: {
      type: String,
      require: true,
    },
    message: {
      type: String,
      require: true,
    },
  },
};
</script>

<style lang="scss">
.qs-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  &__title {
    margin-top: 25px;
    display: inline-flex;
    align-items: center;
    font-size: 20px;
    font-weight: 500;
    color: #ff0000;
  }

  &__list {
    margin: 12px 0 0;
    padding-left: 20px;
  }
}
</style>
