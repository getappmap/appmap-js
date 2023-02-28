<template>
  <div class="spinner">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'SpinnerAnimation',
};
</script>

<style lang="scss" scoped>
.spinner {
  display: inline-block;
  line-height: 0;
  animation: spin 4s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
}
</style>
