<template>
  <div class="trace-node__body--sql">
    <v-sql-code :sql="event.sqlQuery" :database="event.sql.database_type" />
  </div>
</template>

<script>
import { Event } from '@appland/models';
import VSqlCode from '@/components/SqlCode.vue';

export default {
  name: 'v-trace-node-body-sql',
  components: {
    VSqlCode,
  },
  props: {
    event: {
      type: Object,
      required: true,
      validator: (value) => value instanceof Event,
    },
  },
};
</script>

<style scoped lang="scss">
.trace-node__body--sql {
  white-space: pre;
  max-width: 100ex;
  max-height: 30em;
  overflow: auto;
}
</style>
