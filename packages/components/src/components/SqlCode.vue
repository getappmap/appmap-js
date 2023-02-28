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
.sql-code >>> .hljs-keyword,
.sql-code >>> .hljs-selector-tag,
.sql-code >>> .hljs-built_in,
.sql-code >>> .hljs-name,
.sql-code >>> .hljs-tag {
  color: #07a;
}
.sql-code >>> .hljs-number {
  color: #905;
}
.sql-code >>> .hljs-string,
.sql-code >>> .hljs-title,
.sql-code >>> .hljs-section,
.sql-code >>> .hljs-attribute,
.sql-code >>> .hljs-template-tag,
.sql-code >>> .hljs-template-variable,
.sql-code >>> .hljs-type,
.sql-code >>> .hljs-addition {
  color: #690;
}
.sql-code >>> .hljs-symbol,
.sql-code >>> .hljs-bullet,
.sql-code >>> .hljs-link {
  color: #999;
}
</style>
