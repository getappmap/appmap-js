<template>
  <div class="signin-sidebar">
    <AppMapLogo width="120" />
    <div class="content-wrap">
      <div class="sidebar-title">
        <h1 data-cy="title">Sign in</h1>
        <p>
          Start visualizing your runtime code, identifying problems, and finding solutions. Sign in
          via GitHub or GitLab to start automatically generating:
        </p>
      </div>

      <ul class="signin-ctas">
        <li @click="clickSignInLink('sequence-diagrams')">
          <a href="https://appmap.io/docs/diagrams/sequence-diagrams">Sequence diagrams</a>
        </li>
        <li @click="clickSignInLink('trace-views')">
          <a
            href="https://appmap.io/docs/diagrams/how-to-use-appmaps.html#view-and-interact-with-the-trace-diagram"
            >Trace views</a
          >
        </li>
        <li @click="clickSignInLink('dependency-maps')">
          <a
            href="https://appmap.io/docs/diagrams/how-to-use-appmaps.html#view-and-interact-with-the-dependency-map"
            >Dependency maps</a
          >
        </li>
        <li @click="clickSignInLink('flame-graphs')">
          <a href="https://appmap.io/docs/diagrams/flamegraph.html">Flame graphs</a>
        </li>
        <li @click="clickSignInLink('runtime-analysis')">
          <a href="https://appmap.io/docs/analysis/in-your-code-editor.html">Runtime analysis</a>
        </li>
        <li @click="clickSignInLink('appmap-ci')">
          <a href="https://appmap.io/docs/analysis/in-ci.html">AppMap in CI</a>
        </li>
      </ul>
      <div class="signin-buttons">
        <a href="/" class="btn btn-primary" data-cy="sign-in-button" @click="signIn">Sign in</a>
      </div>

      <div class="your-data">
        <shieldIcon />
        <p data-cy="your-data-text">
          Authentication with GitHub or GitLab is used solely for issuing a license. AppMap runs in
          your code editor, so your AppMaps and your source code stay on your machine.
          <a href="https://appmap.io/security">Security FAQ<VExternalLinkIcon /></a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import AppMapLogo from '@/assets/appmap-full-logo.svg';
import shieldIcon from '@/assets/shield-icon.svg';
import VExternalLinkIcon from '@/assets/external-link.svg';

export default {
  name: 'v-sign-in',
  components: {
    AppMapLogo,
    shieldIcon,
    VExternalLinkIcon,
  },

  methods: {
    signIn() {
      this.$root.$emit('sign-in');
    },

    clickSignInLink(linkType) {
      this.$root.$emit('click-sign-in-link', linkType);
    },
  },
};
</script>

<style scoped lang="scss">
.signin-sidebar {
  background-color: $black;
  font-family: $appland-text-font-family;
  color: $white;
  font-family: $appland-text-font-family;
  width: auto;
  height: 100%;
  padding: 1.5rem;
  line-height: 1.4rem;
  .content-wrap {
    margin: 2rem 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-content: center;
    gap: 2rem;
    h1 {
      margin: 0 0 0.75rem 0;
    }
    p {
      margin: 0;
    }
  }

  .btn {
    padding: 0.7rem 1rem;
    border-radius: 0.5rem;
    transition: $transition;
    color: $white;
    text-decoration: none;
    text-align: center;
    width: 80%;
    justify-content: center;
    &.btn-primary {
      background-color: desaturate($powderblue, 20);
      font-weight: 600;
      margin: 0 1.25rem;
      &:hover {
        background-color: darken($powderblue, 15);
      }
    }
  }
}

.signin-not-ready {
  &:hover {
    cursor: pointer;
  }
  .accordion-toggle {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
    justify-content: center;
    &.closed svg {
      transform: rotate(-90deg);
    }
    svg {
      transition: $transition;
      width: 1rem;
      path {
        fill: desaturate($powderblue, 20);
      }
    }
  }
  a {
    color: desaturate($powderblue, 20);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
    svg {
      path {
        fill: desaturate($powderblue, 20);
      }
      margin-left: 0.5rem;
    }
  }
}

.signin-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  a {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    align-items: center;
  }
}
.signin-ctas {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  list-style-type: none;
  font-family: $appland-text-font-family;
  padding: 0;
  margin: 0;
  overflow: hidden;
  li {
    background-color: #091118;
    border-radius: 0.5rem;
    padding: 0.8rem 1rem;
    font-weight: 600;
    transition: $transition;
    a {
      color: desaturate($powderblue, 30);
      text-decoration: none;
      display: flex;
    }
    &:hover {
      background-color: #12222f;
      a {
        text-decoration: underline;
      }
    }
  }
}

.your-data {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid $gray3;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  line-height: 1.4rem;
  svg {
    width: 100%;
    max-width: 33px;
    height: 42px;
  }
  p {
    margin: 0;
  }
  a {
    color: $brightblue;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    svg {
      width: 100%;
      max-width: 14px;
      height: 14px;
      fill: $brightblue;
    }
  }
}

@media (max-width: 365px) {
  .your-data {
    flex-direction: column;
    align-content: center;
    text-align: center;
  }
}
</style>
