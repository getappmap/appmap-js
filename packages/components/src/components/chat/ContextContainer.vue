<template>
  <div
    :class="{ 'context-container': 1, 'context-container--collapsed': collapsed }"
    data-cy="context-container"
  >
    <div
      :class="{
        'context-container__header': 1,
        'context-container__header--collapsable': isReference,
      }"
      @click="onClickHeader"
    >
      <span class="context-container__title">{{ title }}</span>
      <span class="context-container__button-group" v-if="!isReference">
        <span
          class="context-container__button"
          data-cy="expand"
          @click.stop="$emit('expand')"
          v-if="contentType === 'image'"
        >
          <v-expand-icon />
        </span>
        <span
          class="context-container__button"
          data-cy="copy"
          @click.stop="$emit('copy')"
          v-if="contentType === 'text'"
        >
          <v-copy-icon />
        </span>
        <span
          :class="{
            'context-container__button': 1,
            'context-container__button--toggled': pinned,
          }"
          @click.stop="onPin"
          data-cy="pin"
        >
          <v-pin-icon />
        </span>
        <v-popper-menu position="bottom left" :allow-fullscreen="false" ref="popperMenu">
          <template #icon>
            <span class="context-container__button" data-cy="context-menu" v-if="menuItems.length">
              <v-hamburger-menu-icon />
            </span>
          </template>
          <template #body>
            <div class="context-container__menu">
              <div
                v-for="item in menuItems"
                :key="item.label"
                :class="{
                  'context-container__menu-item': 1,
                  'context-container__menu-item--link': !!item.link,
                }"
                @click="performAction(item.action)"
              >
                <template v-if="item.link">
                  <a :href="item.link" target="_blank" @click="closeMenu">{{ item.label }}</a>
                </template>
                <template v-else>{{ item.label }}</template>
              </div>
            </div>
          </template>
        </v-popper-menu>
      </span>
    </div>
    <div
      class="context-container__body"
      data-cy="context-container-body"
      ref="body"
      v-if="!collapsed"
    >
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VCopyIcon from '@/assets/copy-icon.svg';
import VPinIcon from '@/assets/pin.svg';
import VHamburgerMenuIcon from '@/assets/hamburger.svg';
import VExpandIcon from '@/assets/fullscreen.svg';
import VPopperMenu from '@/components/PopperMenu.vue';
import type ContextContainerMenuItem from './ContextContainerMenuItem';

let GlobalId = 0;

export default Vue.extend({
  components: {
    VPinIcon,
    VHamburgerMenuIcon,
    VCopyIcon,
    VExpandIcon,
    VPopperMenu,
  },
  props: {
    title: String,
    contentType: {
      type: String,
      validator: (value: string) => ['text', 'image'].includes(value),
      default: 'text',
    },
    menuItems: {
      type: Array as () => ContextContainerMenuItem[],
      default: () => [],
    },
    handle: {
      type: Number as () => number | undefined,
      required: false,
    },
  },
  data() {
    const isReference = typeof this.handle === 'number';
    return {
      isReference,
      pinned: false,
      collapsed: isReference,
      valueHandle: this.handle ?? GlobalId++,
    };
  },
  methods: {
    onPin() {
      this.$emit('pin', {
        pinned: !this.pinned,
        handle: this.valueHandle,
      });
    },
    closeMenu() {
      if (!this.$refs.popperMenu) return;
      (this.$refs.popperMenu as any).close();
    },
    performAction(action: ContextContainerMenuItem['action']) {
      if (!action) return;
      action();
      this.closeMenu();
    },
    onClickHeader() {
      if (!this.isReference) return;
      this.collapsed = !this.collapsed;
    },
  },
});
</script>

<style lang="scss" scoped>
.context-container {
  margin: 1rem 0;
  border-radius: $border-radius;
  background-color: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(black, 0.1);
  overflow: hidden;
  line-height: 1 !important;
  position: relative;
  box-shadow: 0 0 1rem 0 rgba(black, 0.33);

  &--collapsed {
    .context-container__header {
      border-bottom: none;
    }
  }

  code {
    line-height: 1.6;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: rgba(black, 0.2);
    border-bottom: 1px solid rgba(white, 0.1);

    &--collapsable {
      cursor: pointer;

      &:hover {
        background-color: rgba(white, 0.1);
      }
    }
  }

  &__title {
    display: inline-block;
    padding: 0.5rem 1rem;
    color: #e2e4e5;
  }

  &__button-group {
    display: flex;
    justify-content: end;
    & > *:nth-child(1) {
      border-left: 1px solid rgba(black, 0.1);
    }
  }

  &__button {
    display: inline-block;
    padding: 0.5rem 1rem;
    background-color: rgba(black, 0.1);
    color: #e2e4e5;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    user-select: none;
    height: 100%;

    svg {
      height: 16px;
      width: 16px;
      vertical-align: text-bottom;

      path {
        fill: #e2e4e5;
      }
    }

    &--toggled {
      background-color: rgba(white, 0.25);
      svg {
        transform: scale(1.1);
        filter: drop-shadow(2px 2px 2px rgba(black, 0.75));
        path {
          fill: white;
        }
      }
      &:hover {
        background-color: rgba(white, 0.5) !important;
      }
    }

    &:hover {
      background-color: rgba(white, 0.25);
    }

    &:active {
      background-color: $blue;
      transition: background-color 0s;
    }
  }

  &__menu {
    background-color: rgba(black, 0.5);
    border-radius: 0 0 0 $border-radius;
    border: 1px solid rgba(white, 0.1);
    border-top: 1px solid rgba(black, 0.2);
    border-right: none;
    overflow: hidden;
    backdrop-filter: blur(10px);
  }

  &__menu-item {
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    user-select: none;

    &:hover {
      background-color: rgba(white, 0.25);
    }

    &:active {
      background-color: $blue;
      transition: background-color 0s;
    }

    &--link {
      cursor: initial;
      &:hover {
        background-color: transparent;
      }
    }
  }
}
</style>
