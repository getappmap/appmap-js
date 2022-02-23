<template>
  <section :class="`list list--${type}`">
    <h5 class="list__header">{{ title }}</h5>
    <ul :class="`list__items list__items--${itemsType}`">
      <slot />
    </ul>
  </section>
</template>

<script>
export default {
  name: 'v-list',

  props: {
    title: String,
    type: {
      type: String,
      default: 'default',
    },
    itemsType: {
      type: String,
      default: 'default',
    },
  },
};
</script>

<style lang="scss" scoped>
.list {
  margin-bottom: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: $border-radius;
  padding: 0.5rem;
  color: $base03;
  background-color: rgba(0, 0, 0, 0.1);

  .list__header {
    margin: 0 0 0.25rem;
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
  }

  &--default .list__header {
    color: $base03;
    background-color: $base11;
  }

  &--http .list__header {
    background-color: #542168;
  }

  &--external-service .list__header {
    background-color: $yellow;
    color: $base19;
  }

  &--labels .list__header {
    background-color: $base11;
  }

  &--package .list__header {
    background-color: $teal;
  }

  &--class .list__header,
  &--function .list__header {
    background-color: $blue;
  }

  &--query .list__header {
    background-color: $royal;
  }

  .list__items {
    margin: 0;
    padding: 0;
    list-style-type: none;

    &--cloud {
      margin: 0 -0.25rem 0 -0.25rem;
    }
  }
}
</style>
<style scoped>
.list__items--cloud >>> .list__item {
  margin: 0.25rem;
  border: 1px solid #424750;
  border-radius: 0.5rem;
  display: inline-flex;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}
</style>
