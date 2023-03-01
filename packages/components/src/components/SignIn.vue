<template>
  <div class="signin-sidebar">
    <AppMapLogo width="120" />
    <div class="content-wrap">
      <h1 data-cy="title">Activate</h1>
      <p>To begin using AppMap for free, please sign in using your GitHub or GitLab account.</p>
      <a href="/" class="btn btn-primary" data-cy="sign-in-button" @click="signIn">Get Started</a>
      <div class="your-data">
        <shieldIcon />
        <p data-cy="your-data-text">
          Authentication with GitHub or GitLab is used solely for verification purposes. AppMap will
          not be granted access to source code.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import AppMapLogo from '@/assets/appmap-full-logo.svg';
import shieldIcon from '@/assets/shield-icon.svg';

export default {
  name: 'v-sign-in',
  components: {
    AppMapLogo,
    shieldIcon,
  },

  methods: {
    signIn() {
      this.$root.$emit('sign-in');
    },
  },
};
</script>

<style scoped lang="scss">
.signin-sidebar {
  background-color: $black;
  color: $white;
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
    gap: 1rem;
    h1,
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
    &.btn-primary {
      background-color: desaturate($hotpink, 20);
      font-weight: 600;
      margin: 0 1.25rem;
      &:hover {
        background-color: darken($hotpink, 15);
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
  line-height: 1.2rem;
  margin-top: 0.5rem;
  svg {
    width: 100%;
    max-width: 33px;
    height: 42px;
  }
  p {
    margin: 0;
  }
}

@media (max-width: 365px) {
  .your-data {
    flex-direction: column;
    align-content: center;
    text-align: center;
    svg {
      //max-width: 100px;
    }
  }
}
</style>
