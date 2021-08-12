<template>
  <div class="qs">
    <div class="qs-container">
      <section class="qs-step">
        <div class="qs-step__head">
          <h1 class="qs-title">🥳 Congratulations! You have installed the AppMap extension.</h1>
          <p>You can use this extension to view and navigate existing AppMaps.</p>
        </div>
        <div class="qs-step__block" v-if="hasDetectedLanguage">
          <h3>
            To record AppMaps of your code you must also install the AppMap agent for this project.
          </h3>
          <div class="qs-link-wrap" v-if="selectedLanguage && selectedLanguageData">
            <p>
              We have provided an installer to help you do that. All you have to is open a terminal
              window in the root of your project and paste in this command:
            </p>
            <code>
              {{ selectedLanguageData.installCommand }}
            </code>
            <p>OR</p>
            <p>
              If node-based installers are not your thing you can install the AppMap agent manually
              by following our <a :href="selectedLanguageData.link" target="_blank">quickstart</a>
              guide in the AppMap documentation.
            </p>
            <p>
              After you have installed the agent proceed to <a href="#record-appmaps">Record AppMaps</a>
            </p>
          </div>
        </div>
        <div class="qs-step__block" v-else>
          <p>
            AppMap currently supports Java, Python, and Ruby projects.<br />Visit
            the Quickstart guides for more details:
          </p>
          <ul class="qs-list">
            <li v-for="lang in languages" :key="lang.id">
              <a :href="lang.link"
                >AppMap Quickstart guide for {{ lang.name }}</a
              >
            </li>
          </ul>
          <p class="qs-step__separator">or</p>
          <p>
            For updates on new language support
            <a href="https://discord.com/invite/N9VUap6"
              >join our Discord community</a
            >
          </p>
        </div>
      </section>

      <section class="qs-step">
        <div class="qs-step__head">
          <h1 class="qs-title">Record AppMaps</h1>
        </div>
        <div class="qs-step__block">
          <p>
            Record AppMaps using your existing tests.
          </p>
          <ul>
            <li><a href="">Record AppMaps with RSpec</a></li>
            <li><a href="">Record AppMaps with Minitest</a></li>
            <li><a href="">Record AppMaps with Cucumber</a></li>
          </ul>
          <p>
            If you do not have tests, you can use our Remote recording capability to record your
            application as it runs. This requires a Rails-based application.
          </p>
          <ul>
            <li><a href="">Remote recording</a></li>
          </ul>
        </div>
      </section>

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
        <p>
          Stuck?
          <a
            href="https://appland.com/appmap/support"
            target="_blank"
            rel="noopener noreferrer"
          >Contact an AppLand developer directly.</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import HelpIcon from '@/assets/quickstart/help.svg';

export default {
  name: 'InstallAgent',

  components: {
    HelpIcon,
  },

  props: {
    languages: {
      type: Array,
      default: () => [],
    },
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

  computed: {
    selectedLanguage() {
      return this.languages.filter((lang) => lang.isDetected)[0].id;
    },
    selectedLanguageData() {
      if (!this.selectedLanguage) {
        return null;
      }
      return this.languages.filter(
        (lang) => lang.id === this.selectedLanguage
      )[0];
    },
    notSelectedLanguages() {
      return this.languages.filter((lang) => lang.id !== this.selectedLanguage);
    },
    hasDetectedLanguage() {
      return this.languages.some((lang) => lang.isDetected);
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

  p.qs-step__separator {
    margin: 10px 0;
    opacity: 0.5;
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
</style>
