<template>
  <div class="trace-node__body--sql">{{ sql }}</div>
</template>

<script>
import { Event } from '@/lib/models';
import sqlFormatter from 'sql-formatter';

export default {
  name: 'v-trace-node-body-sql',
  props: {
    event: {
      type: Object,
      required: true,
      validator: (value) => value instanceof Event,
    },
  },
  computed: {
    sql() {
      return sqlFormatter.format(this.event.sqlQuery);
    },
  },
};
</script>

<style scoped lang="scss">
.trace-node__body--sql {
}
</style>
