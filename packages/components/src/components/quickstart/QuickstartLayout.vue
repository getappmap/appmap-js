<template>
  <div class="qs">
    <div class="qs-container">
      <div class="appmap-header">
        <AppMapLogo width="120" />
      </div>
      <div class="qs-content">
        <slot />
      </div>
      <div class="qs-help">
        <HelpIcon class="qs-help__icon" />
        <div class="qs-help__text">
          Stuck?
          <a href="https://appmap.io/slack" target="_blank"
            >Technical support available in Slack</a
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HelpIcon from '@/assets/quickstart/help.svg';
import AppMapLogo from '@/assets/appmap-full-logo.svg';

export default {
  name: 'QuickstartLayout',

  components: {
    HelpIcon,
    AppMapLogo,
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
  background-color: $brightblue;
  color: $white;
}

.qs {
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  font-family: $font-family;
  font-size: $font-size;
  font-weight: $font-weight;
  line-height: 1.75;
  color: $white;
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
    color: $powderblue;
    text-decoration: none;
    transition: $transition;

    &:hover {
      color: #fff;
    }
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
  }
}

.qs-container {
  max-width: 930px;
  margin: auto;
}

.qs-content {
  margin-bottom: 12px;
  background: $gray2;
  filter: $shadow-tile;
  //max-width: 900px;
  border-radius: 8px;
  margin: 1em auto;
  padding: 2em;
  overflow: hidden;
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
  tr {
    border-bottom: 1px solid lighten($gray2, 08);
    a {
      color: $white;
    }
    &:hover {
      background-color: lighten($gray2, 08);
    }
  }
  tbody {
    tr {
      cursor: pointer;
    }
    td {
      padding: 0.2rem 0.5rem;
      color: $powderblue;
      white-space: normal;
      &:hover {
        color: $white;
      }
    }
  }
}

header {
  margin-block-end: 2em;
}

article {
  margin-bottom: 2.5em;
}

.center {
  margin: auto;
}

.fit {
  width: fit-content;
}
</style>
