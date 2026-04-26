<template>
  <div class="sql-code">
    <pre v-html="formattedSQL"></pre>
  </div>
</template>

<script>
import { format as sqlFormatter } from 'sql-formatter';
import hljs from 'highlight.js/lib/core';
import sql from 'highlight.js/lib/languages/sql';

hljs.registerLanguage('sql', sql);
const supportedSqlDialects = new Set([
  'sql',
  'mariadb',
  'mysql',
  'postgresql',
  'db2',
  'plsql',
  'n1ql',
  'redshift',
  'spark',
  'tsql',
]);

export default {
  name: 'v-sql-code',

  props: {
    sql: {
      type: String,
      required: true,
    },
    database: {
      type: String,
    },
  },

  computed: {
    sqlDialect() {
      if (this.database && supportedSqlDialects.has(this.database)) {
        return this.database;
      }

      return 'sql';
    },

    formattedSQL() {
      let formattedSql = this.sql;

      try {
        formattedSql = sqlFormatter(this.sql, {
          language: this.sqlDialect,
        });
      } catch (e) {
        console.info(`Failed to format the following ${this.sqlDialect} query`);
        console.info(this.sql);
      }

      return hljs.highlight(formattedSql, {
        language: 'sql',
        ignoreIllegals: true,
      }).value;
    },
  },
};
</script>

<style scoped>
.sql-code {
  color: #e90;
}
.sql-code :deep(.hljs-keyword),
.sql-code :deep(.hljs-selector-tag),
.sql-code :deep(.hljs-built_in),
.sql-code :deep(.hljs-name),
.sql-code :deep(.hljs-tag) {
  color: #07a;
}
.sql-code :deep(.hljs-number) {
  color: #905;
}
.sql-code :deep(.hljs-string),
.sql-code :deep(.hljs-title),
.sql-code :deep(.hljs-section),
.sql-code :deep(.hljs-attribute),
.sql-code :deep(.hljs-template-tag),
.sql-code :deep(.hljs-template-variable),
.sql-code :deep(.hljs-type),
.sql-code :deep(.hljs-addition) {
  color: #690;
}
.sql-code :deep(.hljs-symbol),
.sql-code :deep(.hljs-bullet),
.sql-code :deep(.hljs-link) {
  color: #999;
}
</style>
