<template>
  <div
    :class="{
      'context-container': 1,
      'context-container--collapsed': collapsed || !isAppliable,
    }"
    data-cy="context-container"
    :data-uri="valueUri"
    :data-reference="isReference"
    :data-collapsed="collapsed"
  >
    <div
      :class="{
        'context-container__header': 1,
        'context-container__header--collapsable': isCollapsable || !isAppliable,
        'context-container__header--file': !isCollapsable && isFile,
      }"
      data-cy="context-header"
      @click="onClickHeader"
      :title="location"
    >
      <span class="context-container__title" data-cy="context-title">&#8206;{{ title }}</span>
      <span class="context-container__button-group" title="">
        <v-popper :time-to-display="250" text="Apply changes" align="right" placement="top">
          <span
            :class="{
              'context-container__button': 1,
              'context-container__button--pending': !!pendingState,
              'context-container__button--failure': pendingState === 'failure',
              'context-container__button--success': pendingState === 'success',
            }"
            data-cy="apply"
            @click.stop="onApply"
            v-if="isFile && isPinnable && isAppliable"
          >
            <transition name="fade" mode="out-in">
              <v-loader v-if="pendingState === 'pending'" />
              <v-check-icon v-else-if="pendingState === 'success'" />
              <v-close-icon v-else-if="pendingState === 'failure'" />
              <v-apply-icon v-else />
            </transition>
          </span>
        </v-popper>
        <v-popper :time-to-display="250" text="Open" align="right" placement="top"></v-popper>
        <span
          class="context-container__button"
          data-cy="jump-to"
          @click.stop="onJumpTo"
          v-if="isReference"
        >
          <v-jump-to-icon />
        </span>
        <v-popper :time-to-display="250" text="Open" align="right" placement="top">
          <span class="context-container__button" data-cy="open" @click.stop="onOpen" v-if="isFile">
            <v-jump-to-icon />
          </span>
        </v-popper>
        <v-popper :time-to-display="250" text="Expand" align="right" placement="top">
          <span
            class="context-container__button"
            data-cy="expand"
            @click.stop="$emit('expand')"
            v-if="contentType === 'image' && !collapsed"
          >
            <v-expand-icon />
          </span>
        </v-popper>
        <v-popper :time-to-display="250" text="Copy" align="right" placement="top">
          <span
            class="context-container__button"
            data-cy="copy"
            @click.stop="$emit('copy')"
            v-if="contentType === 'text' && !collapsed && isAppliable"
          >
            <v-copy-icon />
          </span>
        </v-popper>
        <v-popper
          :time-to-display="250"
          :text="pinned ? 'Unpin from context' : 'Pin to context'"
          align="right"
          placement="top"
        >
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
        </v-popper>
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
import VApplyIcon from '@/assets/apply.svg';
import VCopyIcon from '@/assets/copy-icon.svg';
import VExpandIcon from '@/assets/fullscreen.svg';
import VHamburgerMenuIcon from '@/assets/hamburger.svg';
import VJumpToIcon from '@/assets/open.svg';
import VPinIcon from '@/assets/pin.svg';
import VCheckIcon from '@/assets/success-checkmark.svg';
import VCloseIcon from '@/assets/x-icon.svg';
import VLoader from '@/components/chat/Loader.vue';
import VPopper from '@/components/Popper.vue';
import VPopperMenu from '@/components/PopperMenu.vue';
import Vue, { PropType } from 'vue';
import type ContextContainerMenuItem from './ContextContainerMenuItem';

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
    VPopper,
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
    uri: {
      type: String as PropType<string | undefined>,
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
    isAppliable: {
      type: Boolean,
      default: true,
    },
    isReference: {
      type: Boolean,
      default: false,
    },
  },
  inject: {
    pinnedItems: {
      default: () => [],
    },
  },
  data() {
    return {
      collapsed: this.isReference || !this.isPinnable,
      valueUri: this.uri,
      pendingState: undefined as undefined | 'pending' | 'success' | 'failure',
    };
  },
  computed: {
    pinned(): boolean {
      const { pinnedItems }: { pinnedItems: { uri: string }[] } = this as any;
      return pinnedItems ? pinnedItems.some(({ uri }) => uri === this.uri) : false;
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
        uri: this.valueUri,
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
      if (!this.isCollapsable) {
        if (this.isFile) {
          this.$root.$emit('open-location', this.location, this.directory);
        }
        return;
      }
      this.collapsed = !this.collapsed;
    },
    onJumpTo() {
      if (!this.isReference) return;
      this.$root.$emit('jump-to', this.valueUri);
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
  background-color: $color-background-dark;
  border: 1px solid $color-border;
  line-height: 1 !important;
  position: relative;

  &[data-collapsed] {
    .popper:last-child .context-container__button {
      border-radius: 0 $border-radius $border-radius 0;
    }
  }

  &[data-reference]:not([data-collapsed]) {
    .popper:last-child .context-container__button {
      border-radius: 0 $border-radius 0 0;
    }
  }

  &--collapsed {
    .context-container__header {
      border-bottom: none;
      border-radius: $border-radius;
    }
  }

  code {
    line-height: 1.6;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: $color-background-dark;
    border-bottom: 1px solid $color-border;
    border-radius: $border-radius $border-radius 0 0;

    &--collapsable {
      cursor: pointer;

      &:hover {
        background-color: rgba(white, 0.1);
      }

      .popper:last-child .context-container__button {
        border-radius: 0 $border-radius $border-radius 0;
      }
    }

    &--file {
      .context-container__title {
        color: $color-link;
        cursor: pointer;

        &:hover {
          color: $color-link-hover;
          text-decoration: underline;
        }
      }
    }
  }

  &__title {
    display: inline-block;
    padding: 0.5rem 1rem;
    text-wrap: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    direction: rtl;
  }

  &__button-group {
    display: flex;
    justify-content: end;
    background-color: rgba(black, 0.1);
    position: relative;

    & > :last-of-type {
      .context-container__button {
        border-radius: 0 $border-radius 0 0;
      }
    }

    &::v-deep {
      .popper__text {
        color: $color-foreground;
        backdrop-filter: blur(12px);
        background-color: transparent;
        border-color: rgba(white, 0.2);
        border-bottom: 0;
        border-radius: $border-radius $border-radius 0 0;
        padding: 0.25rem;
        margin-top: 0;

        &:before {
          display: none;
        }
      }
    }

    & > *:nth-child(1) {
      border-left: 1px solid rgba(black, 0.1);
    }
  }

  &__button {
    display: inline-block;
    padding: 0.5rem 1rem;
    color: $color-foreground;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    user-select: none;

    &--pending {
      $bg: black;
      width: 16px;
      height: 50%;
      cursor: initial;

      &:hover {
        background-color: transparent !important;
      }

      &::v-deep > .loader .dot {
        filter: drop-shadow(0 0 0.25rem rgba(white, 1));
        background-color: $color-foreground !important;
      }
    }

    &--failure {
      svg path {
        fill: $color-error !important;
      }
    }

    &--success {
      svg path {
        fill: $color-success !important;
      }
    }

    svg {
      height: 16px;
      width: 16px;
      vertical-align: text-bottom;
      overflow: visible;

      path {
        fill: $color-foreground;
      }
    }

    &--toggled {
      background-color: $color-button-bg-hover;
      svg {
        transform: scale(1.1);
        filter: drop-shadow(2px 2px 2px $color-tile-shadow);
        path {
          fill: $color-button-fg;
        }
      }
      &:hover {
        background-color: $color-button-bg !important;
      }
    }

    &:hover {
      background-color: $color-button-bg;
    }
  }

  &__menu {
    background-color: $color-background;
    border-radius: 0 0 0 $border-radius;
    border: 1px solid $color-border;
    border-right: none;
    overflow: hidden;
  }

  &__menu-item {
    color: $color-foreground;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    user-select: none;

    &:hover {
      background-color: $color-button-bg-hover;
      color: $color-button-fg;
    }

    &:active {
      background-color: $blue;
      transition: background-color 0s;
    }

    &--link {
      color: $color-link;
      cursor: initial;
      &:hover {
        background-color: transparent;
        color: $color-link-hover;
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
