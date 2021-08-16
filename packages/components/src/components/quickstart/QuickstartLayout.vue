<template>
  <div class="qs">
    <div class="qs-container">
      <slot />
    </div>
    <div class="qs-help">
      <HelpIcon class="qs-help__icon" />
      <div class="qs-help__text">
        Stuck?
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
  name: 'QuickstartLayout',

  components: {
    HelpIcon,
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
  background-color: #2a84ef;
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

    &.mb10 {
      margin-bottom: 10px;
    }

    &.mb20 {
      margin-bottom: 20px;
    }
  }

  a {
    color: #2a84ef;
    text-decoration: none;
  }

  code {
    margin: 20px 0;
    display: block;
    border: 1px solid #454545;
    border-radius: 8px;
    max-width: 80%;
    padding: 12px 20px;
    color: #d7ba7d;
  }

  ul {
    padding-left: 10px;

    li::marker {
      content: '> ';
      color: #2a84ef;
    }
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
  max-width: 675px;
  padding: 32px 37px;

  &__head {
    margin-bottom: 30px;
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

.qs-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 17px 8px;

  &__congrats {
    border: 1px solid #a5fc18;
    border-radius: 10px;
    width: 100%;
    padding: 20px;
    background: rgba(87, 189, 51, 0.2);
    font-weight: 500;
  }

  &__list {
    margin: 50px 0 20px;
    line-height: 1.5;
  }

  &__item {
    max-width: 650px;

    &:not(:last-child) {
      margin-bottom: 40px;
    }

    h1.qs-welcome__item-title {
      position: relative;
      margin-bottom: 5px;
      font-size: 18px;
      font-weight: 400;

      &::before {
        content: '';
        position: absolute;
        top: 6px;
        left: -21px;
        display: block;
        width: 12px;
        height: 12px;
        background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAWCAYAAADNX8xBAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAEPSURBVHgBrZLbDYJAEEVnB8O3JWgZPEKkErUDrUDoQCtQO7ADNED4tAQpwX9ezqgkPkDZ1ZNAwuxyc+/dBfgXSZIM4A9gURSnMAy9IAj68APILyHEQtf1I7kbgyIiiqLqaSBEioiuYRgpSICvg6qqBhw3juO1TH/YtkCCExI8cn/QgbdojZtucT2Ku/1J6IG9pmnTpv4Q5Bi19ScrdIX7K8syoDSzeiYb7Y26PyVHj5Azdpj2QBH6+UxOlrZt+/yt6miZ5/nQsiy/Hsg62nMfpmkeXhc6CXEH9Mwdx9m17el9Ebj2kGXZynXd86e9n4Q21INPAil0oEmotYdOQhyDLteMjnMLCuBdwOPjVBVhLnB0jXAe7EHuAAAAAElFTkSuQmCC')
          no-repeat 0 0 / contain;
      }
    }
  }
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
    color: $base07;
    text-align: left;
    white-space: nowrap;
    &:first-child {
      padding-left: 0;
    }
  }
  tbody {
    tr {
      cursor: pointer;
    }
    td {
      padding-top: 2px;
      padding-bottom: 2px;
      color: #2a84ef;
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
