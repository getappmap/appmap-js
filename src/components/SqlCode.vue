<template>
  <div class="sql-code">
    <pre v-html="formattedSQL">{{ formattedSQL }}</pre>
  </div>
</template>

<script>
import hljs from 'highlight.js';
import sqlFormatter from 'sql-formatter';

export default {
  name: 'v-sql-code',

  props: {
    sql: {
      type: String,
      required: true,
    },
  },

  computed: {
    formattedSQL() {
      return hljs.highlight('sql', sqlFormatter.format(this.sql)).value;
    },
  },
};
</script>

<style scoped>
.sql-code {
  color: #e90;
  line-height: 1.2;
}
.sql-code >>> .sql-hl-keyword {
  color: #07a;
}
.sql-code >>> .sql-hl-function {
  color: #dd4a68;
}
.sql-code >>> .sql-hl-number {
  color: #905;
}
.sql-code >>> .sql-hl-string {
  color: #690;
}
.sql-code >>> .sql-hl-special,
.sql-code >>> .sql-hl-bracket {
  color: #999;
}
</style>
