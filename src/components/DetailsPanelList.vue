<template>
  <div class="v-details-panel-list" v-if="items.length > 0">
    <h5>{{title}}</h5>
    <ul>
      <li v-for="(item, index) in items" :key="index">
        <a href="#" @click.prevent="selectItem(item)">
          {{item.text}}
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
import { SELECT_OBJECT } from '@/store/vsCode';

export default {
  name: 'v-details-panel-list',
  props: {
    title: String,
    items: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    selectItem(item) {
      if (!this.$store || !item.kind || !item.object) {
        return;
      }

      this.$store.commit(SELECT_OBJECT, { kind: item.kind, data: item.object });
    },
  },
};
</script>

<style scoped lang="scss">
  .v-details-panel-list {
    list-style-type: none;
    padding: 0;
    margin-bottom: 1.5rem;

    h5 {
      color: $gray4;
      font-size: 1.1rem;
      font-weight: 500;
      line-height: 1.2;
      padding: 0 2rem;
      margin: 0;
    }

    ul {
      list-style-type: none;
      padding: 0;
      margin-bottom: 1.5rem;
      margin-top: 0;

      li {
        border-bottom: 1px solid #343742;
        padding: .5rem 2rem;
        transition: $transition;

        &:hover {
          background-color: $blue;
          border-color: $blue;
          a {
            color: $white;
          }
        }

        &:first-of-type {
          border-top: 1px solid #343742;
        }

        a {
          color: #4362b1;
          text-decoration: none;
        }
      }
    }
  }
</style>
