<template>
  <div
    :class="{ 'context-container': 1, 'context-container--collapsed': collapsed }"
    data-cy="context-container"
    :data-handle="valueHandle"
    :data-reference="isReference"
  >
    <div
      :class="{
        'context-container__header': 1,
        'context-container__header--collapsable': isCollapsable,
      }"
      data-cy="context-header"
      @click="onClickHeader"
    >
      <span class="context-container__title" data-cy="context-title">{{ title }}</span>
      <span class="context-container__button-group">
        <span
          :class="{
            'context-container__button': 1,
            'context-container__button--pending': !!pendingState,
            'context-container__button--failure': pendingState === 'failure',
            'context-container__button--success': pendingState === 'success',
          }"
          data-cy="apply"
          @click.stop="onApply"
          v-if="isFile && isPinnable"
        >
          <transition name="fade" mode="out-in">
            <v-loader v-if="pendingState === 'pending'" />
            <v-check-icon v-else-if="pendingState === 'success'" />
            <v-close-icon v-else-if="pendingState === 'failure'" />
            <v-apply-icon v-else />
          </transition>
        </span>
        <span
          class="context-container__button"
          data-cy="jump-to"
          @click.stop="onJumpTo"
          v-if="isReference"
        >
          <v-jump-to-icon />
        </span>
        <span class="context-container__button" data-cy="open" @click.stop="onOpen" v-if="isFile">
          <v-jump-to-icon />
        </span>
        <span
          class="context-container__button"
          data-cy="expand"
          @click.stop="$emit('expand')"
          v-if="contentType === 'image' && !collapsed"
        >
          <v-expand-icon />
        </span>
        <span
          class="context-container__button"
          data-cy="copy"
          @click.stop="$emit('copy')"
          v-if="contentType === 'text' && !collapsed"
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
          :data-pinned="pinned"
          v-if="isPinnable"
        >
          <v-pin-icon />
        </span>
        <v-popper-menu
          position="bottom left"
          :allow-fullscreen="false"
          ref="popperMenu"
          v-if="menuItems.length && !isReference"
        >
          <template #icon>
            <span class="context-container__button" data-cy="context-menu">
              <v-hamburger-menu-icon />
            </span>
          </template>
          <template #body>
            <div class="context-container__menu" data-cy="context-menu-items">
              <div
                v-for="item in menuItems"
                :key="item.label"
                :class="{
                  'context-container__menu-item': 1,
                  'context-container__menu-item--link': !!item.link,
                }"
                data-cy="context-menu-item"
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
import VJumpToIcon from '@/assets/open.svg';
import VApplyIcon from '@/assets/apply.svg';
import VCheckIcon from '@/assets/success-checkmark.svg';
import VCloseIcon from '@/assets/x-icon.svg';
import VLoader from '@/components/chat/Loader.vue';
import type ContextContainerMenuItem from './ContextContainerMenuItem';
import type { PinEvent } from './PinEvent';

let GlobalId = 0;

export default Vue.extend({
  components: {
    VPinIcon,
    VHamburgerMenuIcon,
    VCopyIcon,
    VExpandIcon,
    VPopperMenu,
    VJumpToIcon,
    VApplyIcon,
    VLoader,
    VCheckIcon,
    VCloseIcon,
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
    location: {
      type: String,
      required: false,
    },
    directory: {
      type: String,
      required: false,
    },
    isPinnable: {
      type: Boolean,
      default: true,
    },
  },
  inject: {
    pinnedItems: {
      default: () => [],
    },
  },
  data() {
    const isReference = typeof this.handle === 'number';
    return {
      isReference,
      collapsed: isReference || !this.isPinnable,
      valueHandle: this.handle ?? GlobalId++,
      pendingState: undefined as undefined | 'pending' | 'success' | 'failure',
    };
  },
  computed: {
    pinned(): boolean {
      const { pinnedItems }: { pinnedItems: PinEvent[] } = this as any;
      return pinnedItems ? pinnedItems.some(({ handle }) => handle === this.valueHandle) : false;
    },
    isFile(): boolean {
      return !!this.location || !!this.directory;
    },
    isCollapsable(): boolean {
      return this.isReference || !this.isPinnable;
    },
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
      if (!this.isCollapsable) return;
      this.collapsed = !this.collapsed;
    },
    onJumpTo() {
      if (!this.isReference) return;
      this.$root.$emit('jump-to', this.valueHandle);
    },
    onOpen() {
      if (!this.isFile) return;
      this.$root.$emit('open-location', this.location, this.directory);
    },
    onApply() {
      if (!this.isFile || !this.isPinnable || this.pendingState) return;
      this.pendingState = 'pending';
      this.$emit('apply', (result: 'success' | 'failure') => {
        this.pendingState = result;
        setTimeout(() => {
          this.pendingState = undefined;
        }, 2000);
      });
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
    text-wrap: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  &__button-group {
    display: flex;
    justify-content: end;
    background-color: rgba(black, 0.1);

    & > *:nth-child(1) {
      border-left: 1px solid rgba(black, 0.1);
    }
  }

  &__button {
    display: inline-block;
    padding: 0.5rem 1rem;
    // background-color: rgba(black, 0.1);
    color: #e2e4e5;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    user-select: none;
    height: 100%;

    &--pending {
      $bg: black;
      width: 16px;
      height: auto;
      cursor: initial;

      &:hover {
        background-color: transparent !important;
      }

      &::v-deep > .loader .dot {
        filter: drop-shadow(0 0 0.25rem rgba(white, 1));
        background-color: #e2e4e5 !important;
      }
    }

    &--failure {
      svg path {
        fill: $red2 !important;
      }
    }

    &--success {
      svg path {
        fill: $success-indicator !important;
      }
    }

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
          stroke: white;
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

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 200ms;
  }
  .fade-enter,
  .fade-leave-to {
    opacity: 0;
  }
}
</style>
