<template>
  <div class="qs">
    <div class="qs-container">
      <div class="qs-head">
        <div class="qs-head__btn-wrap">
          <button
            class="qs-head__btn"
            type="button"
            v-if="currentStep !== 1"
            @click="prevStep"
          >
            <StepLeftIcon class="qs-head__btn-icon" />
          </button>
        </div>
        <span class="qs-head__step"
          >step {{ currentStep }}/{{ stepsCount }}</span
        >
        <div class="qs-head__btn-wrap">
          <button
            class="qs-head__btn"
            type="button"
            v-if="currentStep !== stepsCount"
            @click="nextStep"
          >
            <StepRightIcon class="qs-head__btn-icon" />
          </button>
        </div>
      </div>
      <section class="qs-step" v-if="currentStep === 1">
        <div class="qs-step__head">
          <h1 class="qs-title">Install AppMap Agent</h1>
          <select class="qs-select" v-model="selectedLanguage">
            <option
              v-for="lang in Object.keys(languages)"
              :key="lang"
              :value="lang"
            >
              {{ languages[lang] }}
            </option>
          </select>
        </div>
        <div class="qs-step__block" v-if="!step1Completed && !error">
          <p>
            This will add the following snippet to the top of your Gemfile and
            run bundle to install the AppMap gem.
          </p>
          <code class="qs-code" @click="select">{{
            installSnippets[selectedLanguage]
          }}</code>
          <button class="qs-button" v-if="!isActionRunning" @click="runAction">
            Install the AppMap agent
          </button>
          <div class="qs-loader" v-if="isActionRunning">
            <div class="qs-loader__dot"></div>
            <div class="qs-loader__dot"></div>
            <div class="qs-loader__dot"></div>
          </div>
        </div>
        <div class="qs-step__error" v-if="error">
          <span class="qs-step__error-title">{{ error }}</span>
          <ol class="qs-step__error-list">
            <li class="qs-step__error-list-item">Review the console output</li>
            <li class="qs-step__error-list-item">Make necessary adjustments</li>
            <li class="qs-step__error-list-item">
              <a href="#">Try again to install</a>
            </li>
          </ol>
          <a
            class="qs-step__error-button qs-button qs-button--bordered"
            href="https://appland.com/company/contact-us"
            target="_blank"
            rel="noopener noreferrer"
            >For further assistance please contact us</a
          >
        </div>
        <div class="qs-step__success" v-if="step1Completed && !error">
          <span class="qs-step__success-title">
            <SuccessIcon class="qs-step__success-icon" />
            Agent installed
          </span>
          <button
            type="button"
            class="qs-step__success-next-step qs-button"
            @click="nextStep"
          >
            Next step : Configure AppMap ->
          </button>
        </div>
      </section>
      <section class="qs-step" v-if="currentStep === 2">
        <div class="qs-step__head">
          <h1 class="qs-title">Configure AppMap</h1>
        </div>
        <div class="qs-step__block" v-if="!step2Completed">
          <p>
            This will create an <a href="#">appmap.yml</a> config file in the
            root directory of your project. This will tell AppMap what code to
            record. You can run these defaults or add more packages, gems, or
            specific functions. You can edit this file at any time.
          </p>
          <code class="qs-code" @click="select">{{ appmapYmlSnippet }}</code>
          <button class="qs-button" v-if="!isActionRunning" @click="runAction">
            Create appmap.yml config file
          </button>
          <div class="qs-loader" v-if="isActionRunning">
            <div class="qs-loader__dot"></div>
            <div class="qs-loader__dot"></div>
            <div class="qs-loader__dot"></div>
          </div>
        </div>
        <div class="qs-step__success" v-if="step2Completed">
          <span class="qs-step__success-title">
            <SuccessIcon class="qs-step__success-icon" />
            AppMap configuration file created
          </span>
          <a
            href="#"
            class="qs-step__success-link"
            @click.prevent="viewAppmapYml"
            >appmap.yml</a
          >
          <button
            type="button"
            class="qs-step__success-next-step qs-button"
            @click="nextStep"
          >
            Next step : Record AppMaps ->
          </button>
        </div>
      </section>
      <section class="qs-step" v-if="currentStep === 3">
        <div class="qs-step__head">
          <h1 class="qs-title">Record AppMaps</h1>
          <select class="qs-select">
            <option v-for="framework in testFrameworks" :key="framework">
              {{ framework }}
            </option>
          </select>
        </div>
        <div class="qs-step__block" v-if="!step3Completed">
          <p>
            An easy way to create AppMaps is by running your tests. This will
            run a standard command to run your tests and generate AppMap data.
          </p>
          <code class="qs-code" @click="select"
            >APPMAP=true bundle exec rake test</code
          >
          <button class="qs-button" v-if="!isActionRunning" @click="runAction">
            Run tests to create AppMaps
          </button>
          <div
            class="qs-loader"
            v-if="isActionRunning"
            :data-process="appmapsProgressText"
          >
            <div class="qs-loader__dot"></div>
            <div class="qs-loader__dot"></div>
            <div class="qs-loader__dot"></div>
          </div>
        </div>
        <div class="qs-step__success" v-if="step3Completed">
          <span class="qs-step__success-title">
            <SuccessIcon class="qs-step__success-icon" />
            AppMaps recorded
          </span>
          <button
            type="button"
            class="qs-step__success-next-step qs-button"
            @click="nextStep"
          >
            Next step : View AppMaps ->
          </button>
        </div>
      </section>
    </div>
    <div class="qs-help">
      <HelpIcon class="qs-help__icon" />
      <div class="qs-help__text">
        <p>Need help or want to give feedback?</p>
        <a
          href="https://appland.com/company/contact-us"
          target="_blank"
          rel="noopener noreferrer"
          >Contact an AppLand developer directly.</a
        >
      </div>
    </div>
    <div class="qs-popup-bg" v-if="showProjectSelector">
      <article class="qs-popup">
        <h1 class="qs-popup__title">Select a project</h1>
        <p class="qs-popup__subtitle">
          This workspace contains multiple projects. Select the project you
          would like to map with AppMap
        </p>
        <div class="qs-popup__radio-group">
          <div
            class="qs-popup__radio"
            v-for="project in projects"
            :key="project.name"
          >
            <label class="qs-radio">
              <input
                type="radio"
                :value="project.name"
                v-model="selectedProject"
              />
              <span>{{ project.name }}</span>
            </label>
          </div>
        </div>
        <button class="qs-button" @click="saveSelectedProject">
          Confirm project selection
        </button>
      </article>
    </div>
  </div>
</template>

<script>
import HelpIcon from '@/assets/quickstart/help.svg';
import StepLeftIcon from '@/assets/quickstart/arrow-left.svg';
import StepRightIcon from '@/assets/quickstart/arrow-right.svg';
import SuccessIcon from '@/assets/quickstart/success.svg';

export const Steps = {
  INSTALL_AGENT: 1,
  CONFIGURE_APPMAP: 2,
  RECORD_APPMAPS: 3,
};

export default {
  name: 'Quickstart',

  components: {
    HelpIcon,
    StepLeftIcon,
    StepRightIcon,
    SuccessIcon,
  },

  props: {
    language: {
      type: String,
      default: null,
    },
    testFrameworks: {
      type: Array,
      default: () => [],
    },
    installSnippets: {
      type: Object,
      default: () => {},
    },
    appmapYmlSnippet: {
      type: String,
      default: '',
    },
    initialStep: {
      type: Number,
      default: 1,
    },
    stepsState: {
      type: Array,
      default: () => [],
    },
    appmapsProgress: {
      type: Number,
      default: 0,
    },
    onAction: {
      type: Function,
    },
    onStep: {
      type: Function,
    },
    error: {
      type: String,
    },
  },

  data() {
    return {
      selectedLanguage: this.language,
      selectedTestFramework: this.testFrameworks.length
        ? this.testFrameworks[0]
        : null,
      currentStep: this.initialStep,
      isActionRunning: false,
      showProjectSelector: false,
      projects: [],
      selectedProject: null,
    };
  },

  watch: {
    currentStep: {
      handler() {
        if (typeof this.onStep === 'function') {
          this.onStep(this.currentStep);
        }
      },
    },
  },

  computed: {
    stepsCount() {
      return Object.keys(Steps).length;
    },
    step1Completed() {
      return this.stepsState[0] === 'complete';
    },
    step2Completed() {
      return this.stepsState[1] === 'complete';
    },
    step3Completed() {
      return this.stepsState[2] === 'complete';
    },
    languages() {
      const languages = {
        ruby: 'Ruby',
        java: 'Java',
        python: 'Python',
      };

      if (Object.keys(languages).includes(this.language)) {
        languages[this.language] += ' (detected)';
      }

      return languages;
    },
    appmapsProgressText() {
      return `${this.appmapsProgress} AppMap${
        this.appmapsProgress !== 1 ? 's' : ''
      } created`;
    },
  },

  methods: {
    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep -= 1;
      }
    },
    nextStep() {
      if (this.currentStep < this.stepsCount) {
        this.currentStep += 1;
      }
    },
    async runAction() {
      console.log(this.onAction);
      if (typeof this.onAction !== 'function') {
        return;
      }

      this.isActionRunning = true;

      try {
        await this.onAction(
          this.selectedLanguage,
          this.currentStep,
          this.selectedTestFramework
        );
      } catch (e) {
        console.error(e);
      }

      this.isActionRunning = false;
    },
    projectSelector(projects) {
      this.projects = projects;
      this.selectedProject = projects[0].name;
      this.showProjectSelector = true;
    },
    saveSelectedProject() {
      this.showProjectSelector = false;
      this.$root.$emit('selectedProject', this.selectedProject);
    },
    viewAppmapYml() {
      this.$root.$emit('viewAppmapYml');
    },
    select(event) {
      if (document.selection) {
        const range = document.body.createTextRange();
        range.moveToElementText(event.target);
        range.select();
      } else if (window.getSelection) {
        const range = document.createRange();
        range.selectNode(event.target);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      }
    },
  },
};
</script>

<style lang="scss">
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
  height: 100vh;
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

.qs-code {
  margin-bottom: 25px;
  display: block;
  border: 1px solid #454545;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 12px;
  font-family: 'IBM Plex Mono', 'Helvetica Monospaced', Helvetica, Arial,
    sans-serif;
  color: #8dc149;
  white-space: break-spaces;
}

.qs-loader {
  margin: 10px 0;
  display: inline-flex;
  align-items: center;

  &[data-process]::after {
    content: attr(data-process);
    margin-left: 16px;
    color: #a26eff;
  }

  &__dot {
    border-radius: 50%;
    width: 10px;
    height: 10px;
    background-color: #a26eff;
    animation: qs-load 1s infinite ease-in-out;

    &:not(:last-child) {
      margin-right: 2px;
    }

    &:nth-child(1) {
      animation-delay: -0.6s;
    }

    &:nth-child(2) {
      animation-delay: -0.2s;
    }
  }
}

@keyframes qs-load {
  0%,
  80%,
  100% {
    transform: scale(0.5);
  }
  40% {
    transform: scale(1);
  }
}

.qs-head {
  margin-bottom: 6px;
  padding: 6px 16px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  line-height: 1;

  &__btn-wrap {
    width: 16px;
    height: 16px;
  }

  &__btn {
    border: none;
    display: inline-flex;
    align-items: center;
    padding: 2px;
    background: transparent;
    color: #c5c5c5;
    font: inherit;
    outline: none;
    line-height: 0;
    appearance: none;
    cursor: pointer;

    &:hover,
    &:active {
      color: $base03;
    }

    &-icon {
      width: 12px;
      height: 12px;
      fill: currentColor;
    }
  }

  &__step {
    margin: 0 5px;
  }
}

.qs-step {
  max-width: 520px;
  padding: 0 16px 16px;

  &__head {
    margin-bottom: 6px;
  }

  &__success {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    &-title {
      margin-top: 45px;
      display: inline-flex;
      align-items: center;
      font-size: 20px;
      font-weight: 500;
      color: #8dc149;
    }

    &-icon {
      margin-right: 6px;
      width: 1em;
      height: 1em;
    }

    &-subtitle {
      font-size: 14px;
      color: $gray6;
    }

    &-link {
      font-size: 14px;
    }

    &-next-step {
      margin: 40px 0 55px;
    }
  }

  &__error {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    &-title {
      margin-top: 45px;
      display: inline-flex;
      align-items: center;
      font-size: 20px;
      font-weight: 500;
      color: #ff0000;
    }

    &-list {
      margin: 12px 0 0;
      padding-left: 20px;
    }

    &-button {
      margin: 30px 0 35px;
    }
  }
}

.qs-title {
  display: inline-block;

  & + .qs-select {
    margin-left: 10px;
  }
}

.qs-help {
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

.qs-popup-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
}

.qs-popup {
  border-radius: 10px;
  border: 1px solid #9457ff;
  position: relative;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  display: inline-block;
  width: 510px;
  max-height: 95%;
  padding: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #000;

  &__title,
  p.qs-popup__subtitle {
    margin-bottom: 10px;
  }

  &__radio-group {
    margin-bottom: 20px;
  }

  &__radio:not(:last-child) {
    margin-bottom: 5px;
  }
}

.qs-radio {
  display: inline-block;
  padding-left: 20px;
  cursor: pointer;
  user-select: none;

  input[type='radio'] {
    @include visually-hidden;
  }

  span {
    position: relative;
    display: block;

    &::before {
      content: '';
      position: absolute;
      display: block;
      top: 2px;
      left: -20px;
      width: 11px;
      height: 11px;
      border: 1px solid #a26eff;
      border-radius: 50%;
      background-color: transparent;
    }

    &::after {
      content: '';
      position: absolute;
      display: block;
      border-radius: 50%;
      top: 5px;
      left: -17px;
      width: 7px;
      height: 7px;
      background-color: #a26eff;
      opacity: 0;
    }
  }

  input[type='radio']:checked + span::after {
    opacity: 1;
  }
}
</style>
