<template>
  <div class="v-details-panel-list" v-if="items.length > 0">
    <h5>{{title}}</h5>
    <ul>
      <li v-for="(item, index) in items" :key="index">
        <a v-if="item.kind === 'link'" :href="item.link">
          {{item.text}}
        </a>
        <a v-else href="#" @click.prevent="selectItem(item)">
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
    margin: 2rem 0;
    list-style-type: none;
    padding: 0;

    h5 {
      color: #808b98;
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
      font-weight: 500;
      line-height: 1.2;
    }

    ul {
      list-style-type: none;
      padding: 0;
      margin-bottom: 2.5rem;
      margin-top: 0;

      li {
        border-bottom: 1px solid #343742;
        padding: .25rem 0;

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
