<template>
  <div :class="classes">
    <div class="notification__head" @click="onClick">
      <ArrowUpIcon class="notification__arrow" />
      <span class="notification__title">
        You’ve been updated to <b>{{ version }}</b>
      </span>
      <CloseThinIcon class="notification__close" @click.stop="onClose" />
    </div>
    <div class="notification__body" v-if="isExpanded" v-html="body"></div>
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
    isExpanded: {
      type: Boolean,
      default: false,
    },
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
      if (!this.isExpanded) {
        this.$emit('clickEvent');
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
  font-family: $appland-text-font-family;
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
  }

  svg.notification__arrow {
    fill: $alert-success;
  }

  &__title {
    flex: 1;
    margin: 0 0.5rem;
  }

  &__close {
    cursor: pointer;
  }

  &__body {
    padding: 0.5rem 1rem;
  }

  &--expanded {
    border-color: $base12;
    background-color: transparent;
    color: $gray6;

    svg {
      fill: $base12;
    }

    .notification__head {
      border-bottom: 1px solid $base12;
    }
  }
}
</style>
<style scoped>
.notification__body >>> ul {
  margin: 0.5rem 0;
  padding-left: 1rem;
}

.notification__body >>> ul li:not(:last-child) {
  margin-bottom: 0.5rem;
}
</style>
