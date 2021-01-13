<template>
  <div class="details-panel-header">
    <h4 class="details-panel-header__details-type">{{objectType}}</h4>
    <h4 class="details-panel-header__details-name" :if="title">{{title}}</h4>
    <div class="details-panel-header__ghost-link">
      <slot name="links" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'v-details-panel-header',

  props: {
    objectType: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel-header {
  margin-bottom: 1rem;
  padding: 0 2rem 1rem 2rem;
  border-bottom: 1px solid $base15;
  &__header-text {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 400;
    letter-spacing: .5px;
  }
  &__details-type {
    color: $gray4;
    text-transform: uppercase;
    letter-spacing: .5px;
    border-bottom: 0;
    font-size: .9rem;
    font-weight: 500;
    margin-bottom: .8rem;
  }
  &__details-name {
    color: $base03;
    letter-spacing: .5px;
    border-bottom: 0;
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: .8rem;
    margin-top: .5rem;
  }
  &__ghost-link {
    margin: 1rem 0;
    a {
      padding: .25rem .7rem;
      border: 1px solid lighten($gray3,05);
      border-radius: $border-radius;
      letter-spacing: .5px;
      color: $gray4;
      text-transform: uppercase;
      font-size: .8rem;
      &:hover {
        background-color: darken($vs-code-gray2,05);
        border-radius: $border-radius;
        border-color: darken($vs-code-gray2,03);
      }
    }
  }
}
</style>
