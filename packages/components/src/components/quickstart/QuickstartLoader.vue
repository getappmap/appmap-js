<template>
  <div class="qs-loader" :data-text="text">
    <div class="qs-loader__dot"></div>
    <div class="qs-loader__dot"></div>
    <div class="qs-loader__dot"></div>
  </div>
</template>

<script>
export default {
  name: 'QuickstartLoader',

  props: {
    text: {
      type: String,
      default: '',
    },
  },
};
</script>

<style lang="scss">
.qs-loader {
  margin: 10px 0;
  display: inline-flex;
  align-items: center;

  &[data-text]::after {
    content: attr(data-text);
    margin-left: 16px;
    color: #a26eff;
  }

  &__dot {
    border-radius: 50%;
    width: 10px;
    height: 10px;
    background-color: #a26eff;
    animation: qs-load 1s infinite ease-in-out;

    &:not(:last-child) {
      margin-right: 2px;
    }

    &:nth-child(1) {
      animation-delay: -0.6s;
    }

    &:nth-child(2) {
      animation-delay: -0.2s;
    }
  }
}

@keyframes qs-load {
  0%,
  80%,
  100% {
    transform: scale(0.5);
  }
  40% {
    transform: scale(1);
  }
}
</style>
