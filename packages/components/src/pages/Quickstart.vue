<template>
  <div class="qs">
    <div class="qs-container">
      <div class="qs-head">
        <div class="qs-head__btn-wrap">
          <button
            class="qs-head__btn"
            type="button"
            v-if="canGoPrevStep"
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
            v-if="canGoNextStep"
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
        <div class="qs-step__block" v-if="!step1Completed && !step1Failed">
          <p v-if="selectedLanguage === 'ruby'">
            This will add the following snippet to the top of your Gemfile and
            run bundle to install the AppMap gem.
          </p>
          <code class="qs-code" @click="select">{{
            installSnippets[selectedLanguage]
          }}</code>
          <button class="qs-button" v-if="!isActionRunning" @click="runAction">
            Install the AppMap agent
          </button>
          <!-- <p class="plop">
            <a href="/" class="btn--quickstart">Quickstart</a>
          </p> -->
          
          <QuickstartLoader v-if="isActionRunning" />
        </div>
        <div class="qs-step__success" v-if="step1Completed">
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
        <div v-if="step1Failed">
          <QuickstartError
            v-for="(error, index) in steps[0]['errors']"
            :key="index"
            :code="error.code"
            :message="error.message"
          />
        </div>
      </section>
      <section class="qs-step" v-if="currentStep === 2">
        <div class="qs-step__head">
          <h1 class="qs-title">Configure AppMap</h1>
        </div>
        <div class="qs-step__block" v-if="!step2Completed && !step2Failed">
          <p v-if="selectedLanguage === 'ruby'">
            This will create an appmap.yml config file in the root directory of
            your project. This will tell AppMap what code to record. You can run
            these defaults or add more packages, gems, or specific functions.
            You can edit this file at any time.
          </p>
          <code class="qs-code" @click="select">{{ appmapYmlSnippet }}</code>
          <button class="qs-button" v-if="!isActionRunning" @click="runAction">
            Create appmap.yml config file
          </button>
          <QuickstartLoader v-if="isActionRunning" />
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
        <div v-if="step2Failed">
          <QuickstartError
            v-for="(error, index) in steps[1]['errors']"
            :key="index"
            :code="error.code"
            :message="error.message"
          />
        </div>
      </section>
      <section class="qs-step" v-if="currentStep === 3">
        <div class="qs-step__head">
          <h1 class="qs-title">Record AppMaps</h1>
          <select
            class="qs-select"
            v-model="selectedTestFramework"
            v-if="Object.keys(testFrameworks).length"
          >
            <option
              v-for="framework in Object.keys(testFrameworks)"
              :key="framework"
              :value="framework"
            >
              {{ framework }}
            </option>
          </select>
        </div>
        <div class="qs-step__block">
          <div v-if="step3Failed">
            <QuickstartError
              v-for="(error, index) in steps[2]['errors']"
              :key="index"
              :code="error.code"
              :message="error.message"
            >
              <ol>
                <li>Review the console output</li>
                <li>Make necessary adjustments</li>
                <li>Re-run tests</li>
              </ol>
              <p>
                Note: You can run your tests as normal from the console with
                APPMAP=true
              </p>
            </QuickstartError>
          </div>
          <p v-if="!step3Completed && !step3Failed">
            An easy way to create AppMaps is by running your tests. This will
            run a standard command to run your tests and generate AppMap data.
          </p>
          <div class="qs-code-edit">
            <textarea
              class="qs-code-edit__textarea"
              type="text"
              v-model="testCommand"
              :readonly="!testCommandEdit"
              ref="testCommandInput"
              :style="testCommandStyles"
            ></textarea>
            <button
              class="qs-code-edit__btn"
              type="button"
              v-if="!testCommandEdit"
              @click="makeTestCommandEditable"
            >
              Edit
            </button>
          </div>
          <button class="qs-button" v-if="!isActionRunning" @click="runAction">
            Run tests to create AppMaps
          </button>
          <QuickstartLoader v-if="isActionRunning" />
        </div>
      </section>
      <section class="qs-step" v-if="currentStep === 4">
        <div class="qs-step__head">
          <h1 class="qs-title">Open AppMaps</h1>
        </div>
        <div class="qs-step__block">
          <p>You have completed the Quickstart.</p>
          <p>We’ve identified a few AppMaps you may want to check out first.</p>
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
          <p>
            Browse the
            <a href="#" @click="openLocalAppmaps">local AppMaps</a> and open any
            from the list.
          </p>
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
import HelpIcon from '@/assets/quickstart/question-circle-fill.svg';
import StepLeftIcon from '@/assets/quickstart/arrow-left.svg';
import StepRightIcon from '@/assets/quickstart/arrow-right.svg';
import SuccessIcon from '@/assets/quickstart/success.svg';
import QuickstartError from '@/components/quickstart/QuickstartError.vue';
import QuickstartLoader from '@/components/quickstart/QuickstartLoader.vue';

export const Steps = {
  INSTALL_AGENT: 1,
  CONFIGURE_APPMAP: 2,
  RECORD_APPMAPS: 3,
  OPEN_APPMAPS: 4,
};

const supportedLanguages = {
  ruby: 'Ruby',
};

export default {
  name: 'Quickstart',

  components: {
    HelpIcon,
    StepLeftIcon,
    StepRightIcon,
    SuccessIcon,
    QuickstartError,
    QuickstartLoader,
  },

  props: {
    language: {
      type: String,
      default: null,
    },
    testFrameworks: {
      type: Object,
      default: () => ({}),
    },
    installSnippets: {
      type: Object,
      default: () => ({}),
    },
    appmapYmlSnippet: {
      type: String,
      default: '',
    },
    initialStep: {
      type: Number,
      default: 1,
    },
    steps: {
      type: Array,
      default: () => [],
    },
    appmaps: {
      type: Array,
      default: () => [],
    },
    onAction: {
      type: Function,
    },
    onStep: {
      type: Function,
    },
  },

  data() {
    return {
      selectedLanguage: this.language,
      selectedTestFramework: Object.keys(this.testFrameworks).length
        ? Object.keys(this.testFrameworks)[0]
        : null,
      testCommand: Object.keys(this.testFrameworks).length
        ? this.testFrameworks[Object.keys(this.testFrameworks)[0]]
        : 'APPMAP=true',
      testCommandEdit: !Object.keys(this.testFrameworks).length,
      testCommandHeight: 22,
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
    testFrameworks: {
      handler() {
        if (
          !Object.keys(this.testFrameworks).includes(this.selectedTestFramework)
        ) {
          [this.selectedTestFramework] = Object.keys(this.testFrameworks);
        }
      },
    },
    selectedTestFramework: {
      immediate: true,
      handler() {
        this.testCommand = this.testFrameworks[this.selectedTestFramework];
      },
    },
    testCommand: {
      handler() {
        this.testCommandHeight = this.testCommand.split('\n').length * 22;
      },
    },
  },

  computed: {
    stepsCount() {
      return Object.keys(Steps).length;
    },
    canGoPrevStep() {
      return (
        this.currentStep !== 1 &&
        this.steps[this.currentStep - 2].state !== 'incomplete'
      );
    },
    canGoNextStep() {
      return (
        this.currentStep !== this.stepsCount &&
        this.steps[this.currentStep - 1].state !== 'incomplete'
      );
    },
    step1Completed() {
      return this.steps[0].state === 'complete';
    },
    step1Failed() {
      return this.steps[0].state === 'error';
    },
    step2Completed() {
      return this.steps[1].state === 'complete';
    },
    step2Failed() {
      return this.steps[1].state === 'error';
    },
    step3Completed() {
      return this.steps[2].state === 'complete';
    },
    step3Failed() {
      return this.steps[2].state === 'error';
    },
    languages() {
      const languages = { ...supportedLanguages };

      if (Object.keys(languages).includes(this.language)) {
        languages[this.language] += ' (detected)';
      }

      return languages;
    },
    testCommandStyles() {
      return `height:${this.testCommandHeight}px`;
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
      if (typeof this.onAction !== 'function') {
        return;
      }

      this.isActionRunning = true;

      try {
        const data = {};

        if (this.currentStep === Steps.RECORD_APPMAPS) {
          data.command = this.testCommand.split('\n');
        }

        await this.onAction(this.selectedLanguage, this.currentStep, data);
      } catch (e) {
        console.error(e);
      } finally {
        this.isActionRunning = false;
      }
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
    openAppmap(path) {
      this.$root.$emit('openAppmap', path);
    },
    openLocalAppmaps() {
      this.$root.$emit('openLocalAppmaps');
    },
    makeTestCommandEditable() {
      this.testCommandEdit = true;
      this.$nextTick(() => {
        this.$refs.testCommandInput.focus();
      });
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
    color: $purps;
    text-decoration: none;
  }
}

.qs-container {
  margin: 1rem 0;
  border-radius: .5rem;
  background: #1a1a1a;
  display: flex;
  flex-direction: row-reverse;
  align-content: space-around;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem;
}

.qs-button {
  border: none;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  padding: .5rem 1rem;
  background: $purps;
  color: $gray6;
  font: inherit;
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: $transition;

  &--bordered {
    border: 1px solid $purps;
    padding: 5px 15px;
    background: transparent;
  }

  &:hover {
    background: darken($purps,08);
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
  margin: 1.5rem 0;
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

.qs-code-edit {
  position: relative;
  display: flex;
  margin-bottom: 25px;
  border: 1px solid #454545;
  border-radius: 8px;
  padding: 15px 10px;
  font-size: 12px;
  color: #8dc149;
  white-space: break-spaces;

  &__textarea {
    margin: 0;
    flex: 1;
    border: 0;
    border-radius: 0;
    width: 100%;
    max-width: 100%;
    min-height: 22px;
    max-height: 220px;
    padding: 0 5px;
    font: inherit;
    font-family: 'IBM Plex Mono', 'Helvetica Monospaced', Helvetica, Arial,
      sans-serif;
    line-height: 22px;
    color: inherit;
    white-space: pre;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 22px,
      $vs-code-gray1 22px,
      $vs-code-gray1 44px
    );
    outline: none;
    appearance: none;
    resize: none;
  }

  &__btn {
    position: absolute;
    top: 10px;
    right: 10px;
    border: 1px solid #454545;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    padding: 6px 16px;
    background: transparent;
    color: $gray6;
    font: inherit;
    line-height: 18px;
    white-space: nowrap;
    outline: none;
    appearance: none;
    cursor: pointer;
  }
}

.qs-head {
  margin-bottom: 6px;
  padding: .5rem 0;
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
    color: $purps; //#c5c5c5;
    font: inherit;
    outline: none;
    line-height: 0;
    appearance: none;
    cursor: pointer;

    &:hover,
    &:active {
      color: lighten($purps,08); //$base03;
    }

    &-icon {
      width: 12px;
      height: 12px;
      fill: currentColor;
    }
  }

  &__step {
    margin: 0 5px;
    text-align: center;
  }
}

.qs-step {
  max-width: 600px;

  &__head {
    margin-bottom: 6px;
    line-height: 18px
    
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
  margin-top: 1rem;

  &__icon {
    margin: 0 1rem 0 0;
    width: 24px;
    height: 24px;
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

a.btn--quickstart {
  background-color: $purps;
  padding: .5rem 1rem;
  border: 0;
  transition: $transition;
  color: $white;
  border-radius: $border-radius;
  &:hover {
    background-color: darken($purps, 08);
  }
}

.qs {
  &-title {
    text-shadow: $text-shadow;
  }
}

.qs p.plop {
  margin: 2rem 0;
}

</style>
