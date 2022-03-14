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
        @click.native="selectEvent(item.event)"
      >
        <div class="details-references__text">
          <span>{{ item.event.toString() }}</span>
          <span>
            Matched in
            <span
              class="details-references__match"
              v-for="(match, i) in item.match"
              :key="i"
            >
              <span v-if="match.type === 'param'"
                >parameter <b>{{ match.value }}</b></span
              ><span v-if="match.type === 'sql'"><b>SQL query</b></span
              ><span v-if="match.type === 'return'"><b>return value</b></span>
            </span>
          </span>
        </div>
        <div class="details-references__badges">
          <span v-if="item.type.has('value')" class="details-references__badge"
            >Value</span
          >
          <span
            v-if="item.type.has('reference')"
            class="details-references__badge"
            >Reference</span
          >
        </div>
        <span
          class="details-references__event-quickview"
          @click.stop="focusEvent(item.event)"
          title="View event in Trace view"
        >
          <EyeIcon />
        </span>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import EyeIcon from '@/assets/eye.svg';
import { AppMap } from '@appland/models';
import VList from '@/components/common/List.vue';
import VListItem from '@/components/common/ListItem.vue';
import VListItemParam from '@/components/common/ListItemParam.vue';
import { SELECT_OBJECT, SET_FOCUSED_EVENT } from '@/store/vsCode';

export default {
  name: 'v-details-references',
  components: {
    EyeIcon,
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
      const events = [];
      const matchValue = this.param.value.toLowerCase();

      this.appMap.events.forEach((event) => {
        if (!event.isCall()) {
          return;
        }

        const matchData = {
          event,
          type: new Set(),
          match: [],
        };

        if (event.parameters) {
          event.parameters.forEach((param) => {
            if (param.value && param.value.toLowerCase().includes(matchValue)) {
              matchData.type.add('value');
              matchData.match.push({
                type: 'param',
                value: param.name,
              });
            }
            if (this.param.object_id === param.object_id) {
              matchData.type.add('reference');
            }
          });
        }

        if (event.message) {
          event.message.forEach((msg) => {
            if (msg.value && msg.value.toLowerCase().includes(matchValue)) {
              matchData.type.add('value');
              matchData.match.push({
                type: 'param',
                value: msg.name,
              });
            }
            if (this.param.object_id === msg.object_id) {
              matchData.type.add('reference');
            }
          });
        }

        if (
          event.sqlQuery &&
          event.sqlQuery.toLowerCase().includes(matchValue)
        ) {
          matchData.type.add('value');
          matchData.match.push({
            type: 'sql',
          });
        }

        if (event.returnValue) {
          if (event.returnValue.value.toLowerCase().includes(matchValue)) {
            matchData.type.add('value');
            matchData.match.push({
              type: 'return',
            });
          }
          if (this.param.object_id === event.returnValue.object_id) {
            matchData.type.add('reference');
          }
        }

        if (matchData.type.size) {
          events.push(matchData);
        }
      });

      return events;
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

  &__text {
    margin-right: 0.5rem;
    display: flex;
    flex-direction: column;

    span:nth-child(2) {
      margin-top: 0.25rem;
      font-size: 0.75rem;
    }
  }

  &__match:not(:last-child)::after {
    content: ', ';
  }

  &__badges {
    margin-left: auto;
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

  &__event-quickview {
    margin-left: 0.25rem;
    padding: 0.25rem;
    color: $gray4;
    line-height: 0;
    cursor: pointer;

    &:hover,
    &:active {
      color: $gray5;
    }

    svg {
      width: 1rem;
      height: 1rem;
      fill: currentColor;
    }
  }
}
</style>
