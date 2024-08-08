<template>
  <div class="tech-stack">
    <div class="tech-stack__title">Customize your recording methods by selecting dependencies</div>
    <div class="tech-stack__items">
      <v-button-group
        class="button-group"
        :buttons="webFrameworks"
        label="Web framework"
        @click="onSelectWebFramework"
      />
      <v-button-group
        class="button-group"
        :buttons="testFrameworks"
        label="Test framework"
        @click="onSelectTestFramework"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import VButtonGroup from '@/components/install-guide/ButtonGroup.vue';

export default Vue.extend({
  components: {
    VButtonGroup,
  },
  props: {
    webFrameworks: {
      type: Array as PropType<string[]>,
      required: true,
    },
    testFrameworks: {
      type: Array as PropType<string[]>,
      required: true,
    },
  },
  methods: {
    onSelectWebFramework(webFramework: string) {
      this.$emit('select-web-framework', webFramework);
    },
    onSelectTestFramework(testFramework: string) {
      this.$emit('select-test-framework', testFramework);
    },
  },
});
</script>

<style lang="scss" scoped>
.tech-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  background-color: rgba(black, 0.2);
  border-radius: $border-radius;
  overflow: hidden;

  &__title {
    font-size: 0.75rem;
    // color: $gray4;
    background-color: rgba(black, 0.25);
    padding: 0.5rem 1rem;
    border-bottom: 1px solid rgba(white, 0.1);
    // margin: 0 auto;
  }

  &__items {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: 1rem;
    padding: 1rem;
    padding-top: 0;

    &::v-deep {
      .button-group {
        &__label,
        &__buttons {
          align-self: center;
        }
      }
    }
  }
}
</style>
