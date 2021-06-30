<template>
  <div class="qs">
    <div class="qs-container">
      <div class="qs-head">
        <button class="qs-head__btn" type="button">
          <StepLeftIcon class="qs-head__btn-icon" />
        </button>
        <span class="qs-head__step">step 1/4</span>
        <button class="qs-head__btn" type="button">
          <StepRightIcon class="qs-head__btn-icon" />
        </button>
      </div>
      <section class="qs-step">
        <div class="qs-step__head">
          <h1 class="qs-title">Install AppMap Agent</h1>
          <select class="qs-select">
            <option>Ruby (detected)</option>
            <option>Java</option>
            <option>Python</option>
          </select>
        </div>
        <div class="qs-step__block">
          <p>
            This will add the following snippet to the top of your Gemfile and
            run bundle to install the AppMap gem.
          </p>
          <code class="qs-code" @click="select"
            >gem "appmap", "= 0.53.0", :groups => [:development, :test]</code
          >
          <button class="qs-button">Install the AppMap agent</button>
        </div>
      </section>
    </div>
    <div class="qs-help">
      <HelpIcon class="qs-help__icon" />
      <div class="qs-help__text">
        <p>Need help or want to give feedback?</p>
        <a href="#">Contact an AppLand developer directly.</a>
      </div>
    </div>
  </div>
</template>

<script>
import HelpIcon from '@/assets/quickstart/help.svg';
import StepLeftIcon from '@/assets/quickstart/arrow-left.svg';
import StepRightIcon from '@/assets/quickstart/arrow-right.svg';

export default {
  name: 'Quickstart',

  components: {
    HelpIcon,
    StepLeftIcon,
    StepRightIcon,
  },

  props: {
    step: {
      type: Number,
      default: 1,
    },
  },

  methods: {
    select(event) {
      if (document.selection) {
        var range = document.body.createTextRange();
        range.moveToElementText(event.target);
        range.select();
      } else if (window.getSelection) {
        var range = document.createRange();
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
      background: #010306;
    }
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
    font-family: 'IBM Plex Mono', 'Helvetica Monospaced', Helvetica, Arial,
      sans-serif;
    color: #8dc149;
    white-space: pre;
  }
}

.qs-container {
  margin-bottom: 12px;
  border-radius: 8px;
  max-width: 565px;
  background: #1a1a1a;
}

.qs-head {
  margin-bottom: 6px;
  padding: 6px 16px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  line-height: 1;

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
  padding-bottom: 16px;

  &__head {
    margin-bottom: 6px;
  }

  &__head,
  &__block {
    padding: 0 16px;
  }

  .qs-title {
    display: inline-block;

    & + .qs-select {
      margin-left: 10px;
    }
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
</style>
