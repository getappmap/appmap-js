<template>
  <div class="qs">
    <div class="qs-container">
      <section class="qs-step">
        <div class="qs-step__head">
          <h1 class="qs-title">Open AppMaps</h1>
        </div>
        <div class="qs-step__block" v-if="appmaps.length">
          <p>Here are the AppMaps recorded from your project.</p>
          <p>
            You may want to check out those with Requests and SQL queries first.
          </p>
          <table class="qs-appmaps-table">
            <colgroup>
              <col width="70%" />
              <col width="10%" />
              <col width="10%" />
              <col width="10%" />
            </colgroup>
            <thead>
              <tr>
                <th>AppMap</th>
                <th>Requests</th>
                <th>SQL queries</th>
                <th>Functions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="appmap in appmaps"
                :key="appmap.path"
                @click="openAppmap(appmap.path)"
              >
                <td>{{ appmap.name }}</td>
                <td>{{ appmap.requests }}</td>
                <td>{{ appmap.sqlQueries }}</td>
                <td>{{ appmap.functions }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="qs-noappmaps">No AppMaps found in your project.</div>
      </section>
    </div>
    <div class="qs-help">
      <HelpIcon class="qs-help__icon" />
      <div class="qs-help__text">
        <p>Need help or want to give feedback?</p>
        <a
          href="https://appland.com/appmap/support"
          target="_blank"
          rel="noopener noreferrer"
          >Contact an AppLand developer directly.</a
        >
      </div>
    </div>
  </div>
</template>

<script>
import HelpIcon from '@/assets/quickstart/help.svg';

export default {
  name: 'OpenAppMaps',

  components: {
    HelpIcon,
  },

  props: {
    appmaps: {
      type: Array,
      default: () => [],
    },
  },

  methods: {
    openAppmap(path) {
      this.$root.$emit('openAppmap', path);
    },
  },
};
</script>

<style lang="scss" scoped>
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
}

* {
  box-sizing: border-box;
}

::selection,
::-moz-selection,
::-webkit-selection {
  background-color: #a26eff;
  color: white;
}

.qs {
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 10px 22px;
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: $base07;
  background-color: $vs-code-gray1;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
  }

  p {
    margin: 0;
    line-height: 1.75;
  }

  a {
    color: #a26eff;
    text-decoration: none;
  }
}

.qs-container {
  margin-bottom: 12px;
  border-radius: 8px;
  background: #1a1a1a;
}

.qs-button {
  border: none;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  background: #a26eff;
  color: $gray6;
  font: inherit;
  line-height: 18px;
  outline: none;
  appearance: none;
  cursor: pointer;

  &--bordered {
    border: 1px solid #a26eff;
    padding: 5px 15px;
    background: transparent;
  }

  &__icon {
    margin-right: 10px;
    width: 12px;
    height: 12px;
  }
}

a.qs-button {
  color: $gray6;
}

.qs-select {
  display: inline-block;
  border: 1px solid #454545;
  border-radius: 8px;
  width: auto;
  padding: 5px 30px 5px 10px;
  background: transparent
    url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAGCAYAAAD68A/GAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB0SURBVHgBhc27DYAgEAZguILaEVyEwgmII7gJmzCDE1xBCCWrWJFAAXIFycVo/Jt75LuciDGu4icppQV67857b79QCMHmnB2UUnYAMG+Y0Cim1npIWiDiopTC1tqptbYPtI1ccl5zPD4IjmiQ/NXE1HNEuQFeAUJ2PzwWoAAAAABJRU5ErkJggg==)
    no-repeat top 11px right 10px;
  color: $gray6;
  appearance: none;
  box-shadow: none;
  outline: none;
  text-align: left;
  font: inherit;
  font-size: 14px;
  line-height: 18px;
}

.qs-select::-ms-expand {
  display: none;
}

.qs-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.qs-step {
  max-width: 600px;
  padding: 35px 16px 16px;

  &__head {
    margin-bottom: 6px;
  }
}

.qs-title {
  display: inline-block;

  & + .qs-select {
    margin-left: 10px;
  }
}

.qs-link-wrap {
  margin: 30px 0;
}

.qs-help {
  margin-bottom: 12px;
  display: flex;
  justify-content: flex-start;
  align-items: center;

  &__icon {
    margin: 0 15px;
    width: 22px;
    height: 22px;
  }

  &__text {
    line-height: 18px;
  }
}

.qs-appmaps-table {
  margin: 1.5rem 0;
  border-collapse: collapse;
  width: 100%;

  th,
  td {
    border: none;
    padding: 0 1rem;
    font-weight: normal;
    color: $gray6;
    text-align: left;
    white-space: nowrap;

    &:first-child {
      padding-left: 0;
    }

    &:not(:first-child) {
      font-size: 12px;
    }
  }

  th {
    border-bottom: 0.5rem solid transparent;
    line-height: 1;

    &:nth-child(n + 3) {
      border-left: 1px solid currentColor;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #242c41;
      cursor: pointer;
    }

    td {
      padding-top: 2px;
      padding-bottom: 2px;
      color: #a26eff;
      white-space: normal;
    }
  }
}

.qs-noappmaps {
  margin: 20px 0;
  font-size: 16px;
  color: $hotpink;
}
</style>
