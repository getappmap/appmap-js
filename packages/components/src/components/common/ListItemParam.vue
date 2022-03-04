<template>
  <li class="list__item-param">
    <p v-if="className" class="list__item-param-key">
      {{ name }}:
      <span class="list__item-param-class">{{ className }}</span>
    </p>
    <p v-else class="list__item-param-key">{{ name }}</p>
    <code>
      {{ value }}
      <slot />
    </code>
  </li>
</template>

<script>
export default {
  name: 'v-list-item-param',

  props: {
    name: String,
    className: String,
    value: [Number, String],
  },
};
</script>

<style lang="scss" scoped>
.list__item-param {
  border-bottom: 1px solid #333a4d;
  padding: 0 0 0.25rem;
  transition: $transition;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.75rem;
  font-family: 'IBM Plex Mono', 'Helvetica Monospaced', Helvetica, Arial;

  &-key {
    margin: 0.25rem 0;
  }

  &-class {
    color: $teal;
  }

  code {
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: $border-radius;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    min-height: 35px;
    padding: 0.5rem;
    background-color: rgba(0, 0, 0, 0.1);
    color: inherit;
  }

  a {
    margin: 0;
    width: 100%;
  }
}
</style>
