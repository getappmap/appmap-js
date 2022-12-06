<template>
  <v-quickstart-layout>
    <section class="appmap-signin">
      <header>
        <h1 data-cy="title">Welcome to AppMap</h1>
        <p>Sign in to enable all of AppMap's advanced features.</p>
      </header>
      <main>
        <div class="login">
          <div class="login-sub">
            <a
              class="btn-auth center"
              data-cy="auth-button"
              @click.prevent="$root.$emit('perform-auth')"
            >
              <v-appmap-logo />
              <v-button :label="enableButtonLabel" class="cta-button b-0" />
            </a>
            <a class="secondary-link" href="#" @click="$root.$emit('skip-sign-in')">
              Continue without logging in
            </a>
          </div>
        </div>
      </main>
    </section>
  </v-quickstart-layout>
</template>

<script>
import VQuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import VButton from '@/components/Button.vue';
import Navigation from '@/components/mixins/navigation';
import VAppmapLogo from '@/assets/appmap-logomark.svg';

export default {
  name: 'SignIn',

  components: {
    VQuickstartLayout,
    VButton,
    VAppmapLogo,
  },

  mixins: [Navigation],

  props: {},

  methods: {},

  computed: {
    enableButtonLabel() {
      if (!this.userAuthenticated) return 'Sign in to continue';
      return 'Enable AppMap Runtime Analysis';
    },
  },
};
</script>
<style lang="scss" scoped>
.qs .appmap-signin h1 {
  margin: 0 0 0.5rem 0;
}
section.appmap-signin {
  .login {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: center;
    .login-sub {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
      .secondary-link {
        margin-left: 0.5rem;
      }
    }
    .secondary-link {
      text-align: center;
      color: $gray4;
      &:hover {
        color: $white;
        text-decoration: underline;
      }
    }
  }
}
a.btn.signin {
  border: 1px solid $hotpink;
  border-radius: 0.5rem;
  color: $white;
  padding: 0.4rem 0.8rem;
  display: flex;
  align-items: center;
  width: max-content;

  svg {
    width: 1rem;
    height: 1rem;
    margin: 0 0.5rem 0 0;
  }
  &:hover {
    background-color: $hotpink;
  }
}

.analysis-feature-list {
  list-style-type: none;
  padding: 0;
  h2 {
    display: flex;
    align-items: center;
    color: $white;
    svg {
      margin-right: 0.5rem;
    }
  }
  li {
    color: $gray4;
    margin-bottom: 1rem;
    ul {
      list-style-type: disc;
      padding: 0 2.8rem;
      li {
        margin-bottom: unset;
      }
    }
  }
}

.btn-auth {
  align-items: center;
  background-color: $almost-black;
  border: 3px solid $gray-tertiary;
  border-radius: 1rem;
  box-shadow: $box-shadow-min;
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 0.7rem 1.2rem;
  transition: $transition;
  margin: 0;
  width: max-content;

  .cta-button {
    padding: 0.5rem 0.5rem 0.5rem 4rem;
  }
  svg {
    margin-right: -3rem;
    margin-left: 0.5rem;
    width: 32px;
  }
  &:hover {
    background-color: $black;
    box-shadow: $box-shadow-min;
    border-color: #5f729a;
    .cta-button {
      background: none;
    }
  }
}

.b-0 {
  border: none;
}
</style>
