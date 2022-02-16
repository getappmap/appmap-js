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
    <h4 class="details-panel-header__details-name" :if="title">{{ title }}</h4>
    <p
      class="details-panel-header__details-type"
      :data-type="objectType.toLowerCase()"
    >
      {{ objectType }}
      <span v-if="objectId">#{{ objectId }}</span>
    </p>
    <v-source-code-link :object="object" />
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
  margin: 0 0 1rem;

  &__parents {
    margin-bottom: 1rem;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__parent {
    position: relative;
    border-radius: $border-radius;
    padding: 0.25rem 0.5rem;
    display: inline-flex;
    align-items: center;
    font-size: 0.75rem;
    line-height: 14px;
    background: $blue;
    cursor: pointer;

    &:hover,
    &:active {
      background: $lightblue;
    }

    &-icon {
      margin-right: 0.25rem;
      width: 0.75rem;
      height: 0.75rem;
      min-width: 0.75rem;
      min-height: 0.75rem;
      &:empty {
        display: none;
      }
      svg {
        fill: currentColor;
      }
    }
  }

  &__details-name {
    margin: 0 0 0.2rem;
    font-size: 1rem;
    font-weight: 700;
    color: $gray6;
  }

  &__details-type {
    margin: 0;
    color: $gray4;
    text-transform: uppercase;
    font-size: 0.75rem;
    line-height: 1;

    &[data-type='http'],
    &[data-type='route'] {
      color: #542168;
    }

    &[data-type='external service'] {
      color: $yellow;
    }

    &[data-type='package'] {
      color: $teal;
    }

    &[data-type='class'],
    &[data-type='function'] {
      color: $blue;
    }

    &[data-type='sql query'] {
      color: $royal;
    }
  }
}
</style>
