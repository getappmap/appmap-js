<template>
  <div class="details-panel-header" data-cy="left-panel-header">
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
    <h4 class="details-panel-header__details-type" :data-type="objectType.toLowerCase()">
      <CircleLegend class="legend" />
      {{ objectType }}
      <span v-if="objectId">{{ objectId }}</span>
    </h4>
    <h4 class="details-panel-header__details-name" :if="title">{{ title }}</h4>
    <v-source-code-link :object="object" />
    <div class="details-panel-header__ghost-link">
      <slot name="links" />
    </div>
  </div>
</template>

<script>
import { Event, CodeObjectType } from '@appland/models';
import VNodeTypePackageIcon from '@/assets/node-types/package.svg';
import VNodeTypeClassIcon from '@/assets/node-types/class.svg';
import VNodeTypeFunctionIcon from '@/assets/node-types/function.svg';
import VNodeTypeHttpIcon from '@/assets/node-types/http.svg';
import VNodeTypeRouteIcon from '@/assets/node-types/route.svg';
import VNodeTypeDatabaseIcon from '@/assets/node-types/database.svg';
import VNodeTypeQueryIcon from '@/assets/node-types/query.svg';
import VNodeTypeExternalServiceIcon from '@/assets/node-types/external-service.svg';
import VSourceCodeLink from '@/components/SourceCodeLink.vue';
import { SELECT_OBJECT } from '@/store/vsCode';
import CircleLegend from '@/assets/circle-legend.svg';

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
    VNodeTypeExternalServiceIcon,
    VSourceCodeLink,
    CircleLegend,
  },

  props: {
    objectType: {
      type: String,
      required: true,
    },
    object: {
      type: Object,
    },
    objectId: {
      type: String,
      required: false,
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
          result.push(codeObject.packageObject, codeObject.classObject, codeObject);
        }

        if (codeObject.type === CodeObjectType.ROUTE || codeObject.type === CodeObjectType.QUERY) {
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
  margin: 0 0 24px;

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
    font-size: 0.85rem;
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
    color: $white;
    text-transform: uppercase;
    line-height: 1;
    font-weight: 700;
    margin: 0 0 0.4rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    &[data-type='http server requests'] svg circle,
    &[data-type='http'] svg circle,
    &[data-type='route'] svg circle {
      fill: #542160;
    }

    &[data-type='external service'] svg circle {
      fill: $yellow;
    }

    &[data-type='package'] svg circle {
      fill: $teal;
    }

    &[data-type='event'] svg circle,
    &[data-type='class'] svg circle,
    &[data-type='function'] svg circle {
      fill: $blue;
    }

    &[data-type='database'] svg circle,
    &[data-type='sql query'] svg circle {
      fill: #9c2fba;
    }
  }

  &__details-name {
    color: $gray6;
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 0;
    margin-bottom: 0.8rem;
  }

  &__ghost-link {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>
