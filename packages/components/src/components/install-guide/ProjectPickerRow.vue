<template>
  <tr :class="classes" :data-score="quality" :data-path="path">
    <th class="project-name">{{ name }}</th>
    <v-project-picker-column-value
      v-for="(row, index) in rows"
      :key="index"
      :name="row && row.name"
      :score="(row && row.score) || 0"
    />
  </tr>
</template>

<script>
import VProjectPickerColumnValue from '@/components/install-guide/ProjectPickerColumnValue.vue';

export default {
  name: 'project-picker-row',
  components: { VProjectPickerColumnValue },
  props: {
    selected: Boolean,
    name: String,
    score: Number,
    path: String,
    language: Object,
    testFramework: Object,
    webFramework: Object,
  },
  computed: {
    rows() {
      return [this.language, this.testFramework, this.webFramework];
    },
    quality() {
      if (!this.score || this.score < 2) return 'bad';
      if (this.score < 3) return 'ok';
      return 'good';
    },
    classes() {
      return {
        [this.quality]: true,
        selected: this.selected,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
$color-highlight: rgba(255, 255, 255, 0.1);

tr {
  opacity: 0.6;
  cursor: pointer;
  vertical-align: middle;

  .project-name {
    text-align: left;
    display: flex;
    align-items: center;

    &:before {
      border-style: solid;
      border-width: 1px;
      border-radius: 50%;
      width: 1em;
      height: 1em;
      top: 0;
      left: 0;
      text-align: center;
      vertical-align: middle;
      line-height: 1em;
      margin: 0 1rem 0 0.25rem;
    }
  }

  &.good .project-name:before {
    content: '✔';
    color: $color-success;
    border-color: $color-success;
  }
  &.ok .project-name:before {
    content: '·';
    color: $color-warning;
    border-color: $color-warning;
  }
  &.bad .project-name:before {
    content: '×';
    color: $color-error;
    border-color: $color-error;
  }

  &:hover {
    background-color: $color-highlight;
  }

  &.selected {
    background-color: $color-highlight;
    color: $color-foreground;
    opacity: 1;
  }
}

td,
th {
  padding: 0.5em 2ex;
}
</style>
