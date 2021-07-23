<template>
  <div class="qs">
    <div class="qs-container">
      <section class="qs-step">
        <div class="qs-step__head">
          <h1 class="qs-title">Install AppMap Agent</h1>
          <select class="qs-select" v-model="selectedLanguage">
            <option
              v-for="lang in languagesList"
              :key="lang.id"
              :value="lang.id"
            >
              {{ lang.name }}
            </option>
          </select>
        </div>
        <div class="qs-step__block">
          <p>
            To create AppMaps you need to install the AppMap Agent for your
            language. Visit the quickstart guide in our documentaion to continue
            installation.
          </p>
          <div
            class="qs-link-wrap"
            v-if="selectedLanguage && selectedLanguageData"
          >
            <a :href="selectedLanguageData.link" class="qs-button">
              <img
                class="qs-button__icon"
                src="../assets/quickstart/link.png"
              />
              AppMap Quickstart guide for {{ selectedLanguageData.name }}
            </a>
          </div>
          <div v-if="notSelectedLanguages.length">
            <p>Also available:</p>
            <ul class="qs-list">
              <li v-for="lang in notSelectedLanguages" :key="lang.id">
                <a :href="lang.link"
                  >AppMap Quickstart guide for {{ lang.name }}</a
                >
              </li>
            </ul>
          </div>
        </div>
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
  name: 'InstallAgent',

  components: {
    HelpIcon,
  },

  props: {
    languages: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return {
      selectedLanguage: null,
    };
  },

  computed: {
    languagesList() {
      return this.languages.map(({ ...lang }) => {
        if (lang.isDetected) {
          lang.name += ' (detected)';
        }
        return lang;
      });
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
  },

  mounted() {
    const detectedLanguages = this.languages.filter((lang) => lang.isDetected);

    if (detectedLanguages.length) {
      this.selectedLanguage = detectedLanguages[0].id;
    } else if (this.languages.length) {
      this.selectedLanguage = this.languages[0].id;
    }
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
</style>
