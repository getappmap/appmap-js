<template>
  <div class="v-details-panel-list" v-if="items.length > 0">
    <h5>{{title}}</h5>
    <ul>
      <li v-for="(item, index) in items" :key="index">
        <a href="javascript: void(0)">{{item.text}}</a>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'v-details-panel-list',
  props: {
    title: String,
    items: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style scoped lang="scss">
  .v-details-panel-list {
    list-style-type: none;
    padding: 0;
    margin-bottom: 2.5rem;

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
