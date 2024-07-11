<template>
  <div class="ask-navie ask-navie__wrapper">
    <div class="ask-navie__button" data-cy="ask-navie-button">
      <v-compass-icon class="compass-icon" />
      Ask Navie
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VCompassIcon from '@/assets/compass-simpler.svg';

export default Vue.extend({
  name: 'v-ask-navie-button',
  components: { VCompassIcon },
});
</script>

<style lang="scss" scoped>
$glow-size: 0.2rem;
$glow-blur: 0.5rem;
$glow-alpha: 0.5;
@keyframes pan {
  0%,
  100% {
    background-position: 0% 0%;
  }
  25%,
  75% {
    background-position: 100% 100%;
  }
  50% {
    background-position: 100% 100%;
  }
}

@keyframes fade {
  0%,
  100% {
    opacity: 25%;
  }
  50% {
    opacity: 100%;
  }
}

.ask-navie {
  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $navie-gradient;
    border-radius: $border-radius;
    padding: 3px;
    animation: pan 5s linear infinite;
    background-size: 300% 300%;
    transform: translateZ(0);
    width: fit-content;
    will-change: background-position;

    &::after {
      position: absolute;
      content: '';
      box-shadow: 0 0 $glow-blur $glow-size rgba(#9552af, $glow-alpha);
      width: 100%;
      height: 100%;
      border-radius: $border-radius;
      z-index: -1;
      animation: fade 3s linear infinite;
      will-change: opacity;
    }
  }

  &__button {
    user-select: none;
    padding: 0.5rem;
    background: rgba(26, 40, 78, 0.75);
    border-radius: calc(#{$border-radius} - 2px);
    font-size: 0.9rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    width: fit-content;
    color: $gray5;
    transition: $transition;
    font-weight: normal;
    line-height: initial;

    .compass-icon {
      width: 24px;
      margin: -0.25rem 0.25rem -0.25rem 0;

      path {
        transition: $transition;
        fill: $gray5;
      }

      circle {
        transition: $transition;
        stroke: $gray5;
      }
    }

    &:hover {
      cursor: pointer;
      color: #fff;
      transition: $transition;
      background: rgba(255, 255, 255, 0.2);

      .compass-icon {
        path {
          transition: $transition;
          fill: #fff;
        }

        circle {
          transition: $transition;
          stroke: #fff;
        }
      }
    }
  }
}
</style>
