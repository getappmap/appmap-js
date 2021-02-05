<template>
  <div class="search">
    <div class="search__form">
      <input
        class="search__input"
        type="text"
        placeholder="Filter the diagram by package, class or function"
        autocomplete="off"
      />
    </div>
    <div class="search__results">
      <ul class="search__results-list">
        <li class="search__results-item">
          <span>user::name</span>
          <button class="search__results-item-btn" type="button">×</button>
        </li>
        <li class="search__results-item">
          <span>user::name</span>
          <button class="search__results-item-btn" type="button">×</button>
        </li>
        <li class="search__results-item">
          <span>user::name</span>
          <button class="search__results-item-btn" type="button">×</button>
        </li>
      </ul>
      <button class="search__results-clear-all" type="button">
        × Clear all
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'v-search-panel',
  props: {
    subtitle: String,
    selectedObject: {
      type: Object,
    },
  },
};
</script>

<style scoped lang="scss">
.search {
  background-color: $vs-code-gray1;
  font-family: sans-serif;
  color: $base03;
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  padding: 1.5rem 2rem;
  transition: $transition;
  display: flex;
  flex-direction: column;

  &__form {
    margin-bottom: 1rem;
  }

  &__input {
    border: 1px solid $base15;
    border-radius: $border-radius;
    padding: 0.5rem 1rem;
    font: inherit;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
    width: 100%;
    background-color: transparent;
    color: $gray5;
    outline: none;
  }

  &__results {
    display: flex;

    &-list {
      flex: 1;
      margin: -0.5rem 0 0 -0.5rem;
      display: flex;
      flex-wrap: wrap;
      padding: 0;
      list-style: none;
    }

    &-item {
      margin: 0.5rem 0 0 0.5rem;
      border-radius: $border-radius;
      display: inline-flex;
      align-items: center;
      padding: 0.3rem 0.5rem;
      background: $gray4;
      font-size: 0.9rem;
      color: $gray6;

      &-btn {
        margin-left: 0.3rem;
        border: none;
        border-radius: $border-radius;
        padding: 0.3rem;
        background: transparent;
        color: inherit;
        font: inherit;
        line-height: 0.5;
        outline: none;
        appearance: none;
        cursor: pointer;

        &:hover,
        &:active {
          background: $gray3;
        }
      }
    }

    &-clear-all {
      margin-left: 2rem;
      border: 1px solid transparent;
      border-radius: $border-radius;
      padding: 0.3rem 0.5rem;
      background: transparent;
      color: $gray4;
      appearance: none;
      outline: none;
      cursor: pointer;

      &:hover,
      &:active {
        border-color: $gray4;
      }
    }
  }
}
</style>
