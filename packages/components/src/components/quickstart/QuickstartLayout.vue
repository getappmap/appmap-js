<template>
  <div class="qs">
    <div class="qs-container">
      <div class="appmap-header">
        <AppMapLogo width="120" />
        <v-ai-help-button :style="{ float: 'right' }" v-if="displayAiHelp" />
      </div>
      <div class="qs-content">
        <slot />
      </div>
      <div class="qs-help" v-if="displayHelp">
        <HelpIcon class="qs-help__icon" />
        <div class="qs-help__text">
          Stuck?
          <template v-if="displayAiHelp">
            <a href="#" data-cy="ai-help-secondary" @click.stop.prevent="onClickHelp">
              Ask Navie: AppMap AI
              <v-badge>NEW</v-badge>
            </a>
            or send us an email at
            <a href="mailto:support@appmap.io" target="_blank"> support@appmap.io </a>
          </template>
          <template v-else>
            <a href="mailto:support@appmap.io" target="_blank">
              Send us an email at support@appmap.io
            </a>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HelpIcon from '@/assets/quickstart/help.svg';
import AppMapLogo from '@/assets/appmap-full-logo.svg';
import VAiHelpButton from '@/components/install-guide/AiHelp.vue';
import VBadge from '@/components/Badge.vue';

export default {
  name: 'QuickstartLayout',

  components: {
    HelpIcon,
    AppMapLogo,
    VAiHelpButton,
    VBadge,
  },

  props: {
    displayHelp: {
      type: Boolean,
      default: true,
    },
  },

  inject: {
    displayAiHelp: { default: false },
  },

  methods: {
    onClickHelp() {
      this.$root.$emit('ai-help');
    },
  },
};
</script>

<style lang="scss">
// TODO: Please scope me!
//       I shouldn't be modifying the global styles!

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
  $highlighted-code: #d7ba7d;
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  font-family: $font-family;
  font-size: $font-size;
  font-weight: $font-weight;
  line-height: 1.75;
  color: $white;
  background-color: $black;

  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 1.25em;
  }

  p {
    line-height: 1.75;
  }

  .mb10 {
    margin-bottom: 10px;
  }

  .mb20 {
    margin-bottom: 20px;
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
    color: $highlighted-code;

    &.inline {
      display: inline-block;
      padding: 0 5px 0 5px;
      margin: 0;
      line-height: 1;
      padding: 0.25rem;
      padding-bottom: 0;
      border: none;
      color: $base07;
      background-color: rgba(0, 0, 0, 0.25);

      em {
        color: $highlighted-code;
        font-style: inherit;
      }
    }
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
  border-radius: 8px;
  margin: 1em auto;
  padding: 2em;
  overflow-x: hidden;
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

header {
  margin-block-end: 2em;
}

h1 {
  margin-block-start: 0;
  font-size: 2em;
  line-height: 2.25rem;
  margin-bottom: 0.25rem;
}

article {
  margin-bottom: 1.5em;
}

.center {
  margin: auto;
  text-align: center;
}

.fit {
  width: fit-content;
}

.recording-method {
  padding-left: 2rem;
  &--disabled {
    color: #999;
  }
  h3 {
    display: flex;
  }
  &:last-child {
    margin-bottom: 2rem;
  }
}
i.header-icon {
  width: 1.75rem;
  margin-right: 0.75rem;
  display: inline-flex;
  align-items: center;
  &--disabled {
    opacity: 0.5;
  }
}

.recommended-badge {
  background-color: #435089;
  padding: 1px 12px;
  color: white;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-left: 0.5rem;
  text-align: center;
  display: inline-flex;
  align-items: center;
}
#IntelliJ-screenshot {
  max-width: 100%;
  padding: 1rem;
  border-radius: 10px;
  background-color: #343e5a;
  img {
    max-width: 100%;
    box-shadow: #000 5px 5px 9px;
  }
}
@media (max-width: 900px) {
  .recording-method {
    padding-left: 1rem;
  }
}
@media (max-width: 450px) {
  .recording-method {
    padding-left: 0rem;
  }
  div#IntelliJ-screenshot {
    display: none;
  }
}
</style>
