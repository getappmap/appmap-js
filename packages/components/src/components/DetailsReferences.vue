<template>
  <div class="details-references">
    <div class="details-references__header">
      <h4 class="details-references__header-title">Find references</h4>
      <v-list-item-param
        :name="param.name"
        :value="param.value"
        :className="param.class"
      />
    </div>
    <v-list title="Matches">
      <v-list-item
        class="details-references__item"
        v-for="item in matchedEvents"
        :key="item.event.id"
        @click.native="focusEvent(item.event)"
        @dblclick.native="selectEvent(item.event)"
      >
        {{ item.event.toString() }}
        <div class="details-references__badges">
          <span
            v-if="item.match.includes('value')"
            class="details-references__badge"
            >Value</span
          >
          <span
            v-if="item.match.includes('reference')"
            class="details-references__badge"
            >Reference</span
          >
        </div>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import { AppMap } from '@appland/models';
import VList from '@/components/common/List.vue';
import VListItem from '@/components/common/ListItem.vue';
import VListItemParam from '@/components/common/ListItemParam.vue';
import { SELECT_OBJECT, SET_FOCUSED_EVENT } from '@/store/vsCode';

export default {
  name: 'v-details-references',
  components: {
    VList,
    VListItem,
    VListItemParam,
  },
  props: {
    param: {
      type: Object,
      required: true,
    },
    appMap: AppMap,
  },
  computed: {
    matchedEvents() {
      const events = {};
      const regex = new RegExp(this.param.value, 'i');

      this.appMap.events.forEach((event) => {
        if (!event.isCall()) {
          return;
        }
        // find by value
        if (
          (event.parameters &&
            event.parameters.some((param) => regex.test(param.value))) ||
          (event.message &&
            event.message.some((msg) => regex.test(msg.value))) ||
          (event.sqlQuery && regex.test(event.sqlQuery)) ||
          (event.returnValue && regex.test(event.returnValue.value))
        ) {
          events[event.id] = { event, match: ['value'] };
        }
        // find by reference
        if (
          (event.parameters &&
            event.parameters.some(
              (param) => this.param.object_id === param.object_id
            )) ||
          (event.message &&
            event.message.some(
              (msg) => this.param.object_id === msg.object_id
            )) ||
          (event.returnValue &&
            this.param.object_id === event.returnValue.object_id)
        ) {
          if (events[event.id]) {
            events[event.id].match.push('reference');
          } else {
            events[event.id] = { event, match: ['reference'] };
          }
        }
      });

      return Object.values(events);
    },
  },
  methods: {
    focusEvent(event) {
      if (this.$store) {
        this.$store.commit(SET_FOCUSED_EVENT, event);
      }
    },
    selectEvent(event) {
      if (this.$store) {
        this.$store.commit(SELECT_OBJECT, event);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.details-references {
  margin-bottom: 1rem;

  &__header {
    margin: 0 0 1rem;

    &-title {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 700;
      color: $base03;
    }
  }

  &__item {
    user-select: none;
  }

  &__badges {
    margin-left: 0.5rem;
    flex-shrink: 0;
    display: inline-flex;
  }

  &__badge {
    border-radius: $border-radius;
    padding: 0.125rem 0.5rem;
    font-size: 11px;
    line-height: 13px;
    background: rgba(0, 0, 0, 0.2);

    & + & {
      margin-left: 0.25rem;
    }
  }
}
</style>
