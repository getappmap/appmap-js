<template>
  <div :class="classes">
    <div class="notification__head" @click="onClick">
      <ArrowUpIcon class="notification__arrow" />
      <span class="notification__title">
        You’ve been updated to <b>{{ version }}</b>
      </span>
      <CloseThinIcon class="notification__close" @click.stop="onClose" />
    </div>
    <div class="notification__body-container">
      <div class="notification__body" v-show="isExpanded">
        <div class="notification__body-document">
          <iframe class="notification__body-document" :srcdoc="body" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ArrowUpIcon from '@/assets/arrow-up.svg';
import CloseThinIcon from '@/assets/close-thin.svg';

export default {
  name: 'v-notification',

  components: {
    ArrowUpIcon,
    CloseThinIcon,
  },

  props: {
    version: {
      type: String,
      default: '',
    },
    body: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      isExpanded: false,
    };
  },

  computed: {
    classes() {
      const classNames = ['notification'];

      if (this.isExpanded) {
        classNames.push('notification--expanded');
      }

      return classNames;
    },
  },

  methods: {
    onClick() {
      this.isExpanded = !this.isExpanded;
      if (this.isExpanded) {
        this.$emit('openEvent');
      }
    },

    onClose() {
      this.$emit('closeEvent');
    },
  },
};
</script>

<style lang="scss" scoped>
.notification {
  border: 1px solid transparent;
  border-radius: $border-radius;
  background-color: $gray6;
  color: $gray2;
  font-size: 0.75rem;
  line-height: 1;
  white-space: nowrap;

  svg {
    width: 1rem;
    height: 1rem;
    fill: $gray2;
  }

  &__head {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    cursor: pointer;
    user-select: none;
  }

  svg.notification__arrow {
    fill: $alert-success;
  }

  &__title {
    flex: 1;
    margin: 0 0.5rem;
    font-family: $appland-text-font-family;
  }

  &__close {
    cursor: pointer;
  }

  &__body-container {
    position: relative;
  }

  &__body {
    position: absolute;
    z-index: 2147483647;
    width: 100%;
    box-shadow: 0.2em 0.2em 10px 0px rgb(0 0 0 / 60%);
    background-color: $white;
    color: $gray2;
    border-radius: $border-radius;
    max-height: 50vh;
    padding: 0 0.25rem;
    overflow: hidden;
    margin-top: 0.5rem;
  }

  &__body-document {
    border: none;
    width: 100%;
    height: 100vh;
    max-height: 50vh;
  }

  &--expanded {
    border-color: $base12;

    svg {
      fill: $base12;
    }
  }

  .notification__body >>> ul {
    margin: 0.5rem 0;
    padding-left: 1rem;
  }

  .notification__body >>> ul li:not(:last-child) {
    margin-bottom: 0.5rem;
  }
}
</style>
