<template>
  <td :class="classes" :title="name">
    {{ name || '—' }}
  </td>
</template>

<script>
export default {
  name: 'project-picker-row',
  props: {
    name: String,
    score: Number,
  },
  computed: {
    classes() {
      if (this.score < 1) return 'empty';
      if (this.score < 2) return 'bad';
      if (this.score < 3) return 'ok';
      return 'good';
    },
  },
};
</script>

<style lang="scss" scoped>
.ok {
  color: $ok-status;
}
.bad {
  color: $bad-status;
}
</style>
