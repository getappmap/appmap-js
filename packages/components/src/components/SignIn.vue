<template>
  <div class="signin-sidebar">
    <AppMapLogo width="120" />
    <div v-if="!submitted" class="content-wrap">
      <div data-cy="title">Activate AppMap</div>

      <div class="signin-buttons">
        <p v-if="error" class="error">{{ error }}</p>
        <input
          id="email-input"
          type="email"
          placeholder="email address"
          v-model="email"
          @keydown="keyDown"
          required
        />
        <a
          href="/"
          class="btn btn-primary"
          data-cy="email-activation-button"
          @click.prevent="activateWithEmail"
        >
          Get activation code by <span><EmailIcon class="small-logo" /> Email</span>
        </a>

        <div class="or-divider-container">
          <div class="line"></div>
          <p class="or-divider">OR</p>
          <div class="line"></div>
        </div>

        <a
          class="btn btn-primary"
          data-cy="github-activation-button"
          href="/"
          @click.prevent="signIn"
        >
          Activate with <span><GitHubLogo class="small-logo" /> GitHub</span>
        </a>
        <a
          class="btn btn-primary"
          data-cy="gitlab-activation-button"
          href="/"
          @click.prevent="signIn"
        >
          Activate with <span><GitLabLogo class="small-logo" /> GitLab</span>
        </a>

        <div class="accept-tos">
          <p>
            By activating AppMap, I agree to the
            <a
              class="link"
              target="_blank"
              href="https://appmap.io/community/terms-and-conditions.html"
            >
              AppMap Terms of Service<ExternalLinkIcon />
            </a>
          </p>
        </div>
      </div>

      <div class="your-data">
        <ShieldIcon />
        <div data-cy="your-data-text" class="your-data-text">
          <p>
            Your email address is used solely to issue you an AppMap license. Your source code and
            AppMaps stay on your machine when you use AppMap diagrams and runtime analysis. Consult
            the
            <a
              class="link"
              target="_blank"
              href="https://appmap.io/community/terms-and-conditions.html"
            >
              Terms of Service<ExternalLinkIcon />
            </a>
            for data privacy terms of Navie AI.
          </p>
        </div>
      </div>
    </div>

    <div v-else class="finish-activation">
      <div class="sidebar-title">
        <h1 data-cy="title">Complete Activation</h1>
        <p>
          Check your inbox! We've sent you an email with a 6-digit verification code. Enter the code
          below.
        </p>
      </div>

      <div class="signin-buttons">
        <p v-if="error" class="error">{{ error }}</p>
        <input
          id="verification-code-input"
          v-model="verificationCode"
          type="text"
          placeholder="verification code"
          @keydown="keyDown"
        />
        <a
          href="/"
          class="btn btn-primary"
          data-cy="verify-button"
          @click.prevent="completeActivation"
        >
          Complete Activation
        </a>

        <p class="no-email">
          Didn't receive the email? Check your spam folder or
          <a class="link" href="/" @click.prevent="reset"> try again</a>.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import AppMapLogo from '@/assets/appmap-full-logo.svg';
import ShieldIcon from '@/assets/shield-icon.svg';
import GitHubLogo from '@/assets/github-logo.svg';
import GitLabLogo from '@/assets/gitlab-logo.svg';
import EmailIcon from '@/assets/email.svg';
import ExternalLinkIcon from '@/assets/external-link.svg';

const GENERIC_ERROR_MSG = 'Something went wrong, please try again later.';

export default {
  name: 'v-sign-in',

  components: {
    AppMapLogo,
    ShieldIcon,
    GitHubLogo,
    GitLabLogo,
    ExternalLinkIcon,
    EmailIcon,
  },

  props: {
    appmapServerUrl: {
      type: String,
      default: 'https://getappmap.com',
    },
  },

  data() {
    return {
      email: '',
      submitted: false,
      verificationCode: '',
      error: '',
      pendingRequest: undefined,
    };
  },

  methods: {
    keyDown(event) {
      if (event.key === 'Enter') {
        if (event.srcElement.id === 'email-input') {
          this.activateWithEmail();
        } else if (event.srcElement.id === 'verification-code-input') {
          this.completeActivation();
        }
      }
    },
    signIn() {
      this.$root.$emit('sign-in');
    },
    reset() {
      this.email = '';
      this.error = '';
      this.verificationCode = '';
      this.submitted = false;
    },
    trimWhitespace(stringToTrim) {
      return String(stringToTrim).trim();
    },
    async activateWithEmail() {
      if (this.pendingRequest) return;

      const url = new URL('/api/activations', this.appmapServerUrl);
      this.addParamsToUrl(url, { email: this.trimWhitespace(this.email) });
      this.pendingRequest = fetch(url, { method: 'POST' });
      try {
        const response = await this.pendingRequest;
        if (response.status === 201) {
          this.error = '';
          this.submitted = true;
        } else if (response.status < 500 && response.status >= 400) {
          this.email = '';
          this.error = this.generateInvalidFieldMsg('email address');
        } else {
          this.email = '';
          this.error = GENERIC_ERROR_MSG;
        }
      } catch (error) {
        this.error = GENERIC_ERROR_MSG;
        this.email = '';
      } finally {
        this.pendingRequest = undefined;
      }
    },
    async completeActivation() {
      if (this.pendingRequest) return;

      const url = new URL('/api/activations/verify', this.appmapServerUrl);
      this.addParamsToUrl(url, {
        email: this.trimWhitespace(this.email),
        code: this.trimWhitespace(this.verificationCode),
      });
      this.pendingRequest = fetch(url, { method: 'POST' });
      try {
        const response = await this.pendingRequest;
        if (response.status === 200) {
          const data = await response.json();
          this.$root.$emit('activate', data.api_key);
        } else {
          this.verificationCode = '';
          this.error =
            response.status < 500 && response.status >= 400
              ? this.generateInvalidFieldMsg('verification code')
              : (this.error = GENERIC_ERROR_MSG);
        }
      } catch (error) {
        this.error = GENERIC_ERROR_MSG;
        this.submitted = false;
      } finally {
        this.pendingRequest = undefined;
      }
    },
    addParamsToUrl(url, params) {
      Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
    },
    generateInvalidFieldMsg(field) {
      return `Invalid ${field}, please try again.`;
    },
  },
};
</script>

<style scoped lang="scss">
.signin-sidebar {
  background-color: $black;
  font-family: $appland-text-font-family;
  color: $white;
  width: auto;
  height: 100%;
  padding: 1.5rem;
  line-height: 1.4rem;

  .content-wrap {
    max-width: 500px;
  }

  a.link {
    color: $brightblue;
    text-decoration: none;
    transition: $transition;

    svg {
      transition: $transition;
      margin: 0 0.3rem;
      width: 90%;
      max-width: 14px;
      height: 14px;
      fill: $brightblue;
    }

    &:hover {
      transition: $transition;
      color: lighten($brightblue, 15%);

      svg {
        transition: $transition;
        fill: lighten($brightblue, 15%);
      }
    }
  }

  .btn {
    padding: 0.7rem 1rem;
    border-radius: 0.5rem;
    transition: $transition;
    color: $white;
    text-decoration: none;
    text-align: center;
    width: 90%;
    justify-content: center;
    display: flex;

    span {
      display: flex;
      align-items: center;

      .small-logo {
        width: 17px;
        margin: 0 0.5rem;
      }
    }

    &.btn-primary {
      background-color: desaturate($powderblue, 20);
      font-weight: 600;

      &:hover {
        background-color: darken($powderblue, 15);
        transition: $transition;
      }
    }
  }

  @media (max-width: 300px) {
    .btn {
      flex-direction: column;
      align-items: center;
    }
  }

  .content-wrap {
    margin: 1em 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-content: center;
    gap: 1em;

    .sidebar-title {
      line-height: 2rem;
      font-size: 1.17em;
      font-weight: bold;
    }

    p {
      margin: 0;
    }
  }

  .signin-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;

    .or-divider-container {
      display: flex;
      width: 90%;

      .or-divider {
        margin: 0 0.5rem;
        color: $gray4;
      }

      .line {
        align-self: center;
        height: 0px;
        width: 90%;
        border-top: 1px solid $gray4;
      }
    }

    .error {
      color: $hotpink;
      margin: 0;
    }

    .accept-tos {
      width: 90%;
    }
  }

  input[type='email'],
  input[type='text'] {
    width: 90%;
    color: $white;
    font-size: 1em;
    background-color: inherit;
    border: 1px solid $gray5;
    padding: 0.75rem;
    border-radius: 10px;

    &:focus {
      outline: none;
    }
  }

  .your-data {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid $gray3;
    border-radius: 0.5rem;
    line-height: 1.2rem;

    svg {
      width: 100%;
      max-width: 33px;
      height: 42px;
    }

    .your-data-text {
      font-size: 0.85rem;
    }
  }

  @media (max-width: 365px) {
    .your-data {
      flex-direction: column;
      align-content: center;
      text-align: center;
    }
  }

  .finish-activation {
    .sidebar-title {
      margin-bottom: 2rem;
    }

    .no-email {
      line-height: 1rem;
    }
  }
}
</style>
