<template>
  <div class="details-panel-header">
    <div class="details-panel-header__parents" v-if="parents.length">
      <div
        class="details-panel-header__parent"
        v-for="(item, index) in parents"
        :key="index"
        @click="selectObject(item)"
      >
        <div class="details-panel-header__parent-icon">
          <component :is="`v-node-type-${item.type}-icon`" />
        </div>
        {{ item.name }}
      </div>
    </div>
    <h4 class="details-panel-header__details-type">{{ objectType }}</h4>
    <h4 class="details-panel-header__details-name" :if="title">{{ title }}</h4>
    <div class="details-panel-header__ghost-link">
      <slot name="links" />
    </div>
  </div>
</template>

<script>
import VNodeTypePackageIcon from '@/assets/node-types/package.svg';
import VNodeTypeClassIcon from '@/assets/node-types/class.svg';
import VNodeTypeFunctionIcon from '@/assets/node-types/function.svg';
import VNodeTypeHttpIcon from '@/assets/node-types/http.svg';
import VNodeTypeRouteIcon from '@/assets/node-types/route.svg';
import VNodeTypeDatabaseIcon from '@/assets/node-types/database.svg';
import VNodeTypeQueryIcon from '@/assets/node-types/query.svg';
import { SELECT_OBJECT } from '@/store/vsCode';
import { Event, CodeObjectType } from '@appland/models';

export default {
  name: 'v-details-panel-header',

  components: {
    VNodeTypePackageIcon,
    VNodeTypeClassIcon,
    VNodeTypeFunctionIcon,
    VNodeTypeHttpIcon,
    VNodeTypeRouteIcon,
    VNodeTypeDatabaseIcon,
    VNodeTypeQueryIcon,
  },

  props: {
    objectType: {
      type: String,
      required: true,
    },
    object: {
      type: Object,
    },
    title: {
      type: String,
    },
  },

  computed: {
    parents() {
      let codeObject;
      if (this.object instanceof Event) {
        codeObject = this.object.codeObject;
      } else {
        codeObject = this.object;
      }

      const result = [];
      if (codeObject) {
        if (codeObject.type !== CodeObjectType.QUERY) {
          result.push(
            codeObject.packageObject,
            codeObject.classObject,
            codeObject
          );
        }

        if (
          codeObject.type === CodeObjectType.ROUTE ||
          codeObject.type === CodeObjectType.QUERY
        ) {
          result.unshift(codeObject.parent);
        }
      }

      return result.filter((obj) => obj && obj !== this.object);
    },
  },
  methods: {
    selectObject(obj) {
      if (this.$store) {
        this.$store.commit(SELECT_OBJECT, obj);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel-header {
  margin: 1rem 0;
  padding: 0 2rem 1rem 2rem;
  border-bottom: 1px solid $base15;

  &__parents {
    margin-bottom: 1rem;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  &__parent {
    position: relative;
    margin: 0 1rem 0.5rem 0;
    border-radius: $border-radius;
    padding: 0.3rem 0.5rem;
    display: inline-flex;
    align-items: center;
    background: $blue;
    cursor: pointer;
    &:hover,
    &:active {
      background: $lightblue;
    }
    &::after {
      content: '❯';
      position: absolute;
      top: 50%;
      left: 100%;
      margin-left: 0.3rem;
      transform: translateY(-50%);
      font-size: 0.6rem;
      pointer-events: none;
    }
    &-icon {
      margin-right: 0.5rem;
      width: 1rem;
      height: 1rem;
      min-width: 1rem;
      min-height: 1rem;
      &:empty {
        display: none;
      }
      svg {
        fill: currentColor;
      }
    }
  }

  &__details-type {
    color: $gray4;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 0;
    font-size: 0.9rem;
    font-weight: 500;
    margin: 0 0 0.2rem;
  }

  &__details-name {
    color: $base03;
    letter-spacing: 0.5px;
    border-bottom: 0;
    font-size: 1.5rem;
    font-weight: 500;
    margin-top: 0;
    margin-bottom: 0.8rem;
  }
}
</style>
