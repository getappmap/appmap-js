<template>
  <div class="llm-configuration">
    <v-modal v-if="modalVisible" @close="hideModal" data-cy="llm-config-modal">
      <div class="llm-configuration__content">
        <div class="config-header">
          <h1>LLM Configuration</h1>
          <v-close-icon class="close-icon" @click="hideModal" />
        </div>
        <div class="config-options">
          <div class="option" data-cy="llm-modal-option" data-option="copilot">
            <div class="description">
              <h1>Use the GitHub Copilot language model</h1>
              <p>
                If you have an active GitHub Copilot subscription, you can use it with AppMap Navie.
                Your AI completions will be served by Copilot.
              </p>
              <a
                href="https://appmap.io/docs/navie-reference/navie-copilot-backend.html"
                target="_blank"
              >
                Visit the documentation to learn more.
              </a>
            </div>
            <div class="action">
              <v-button
                size="medium"
                kind="native"
                @click.native="selectOption('copilot')"
                :disabled="selectedOption === 'copilot'"
                data-cy="llm-select"
              >
                {{ selectedOption === 'copilot' ? 'Selected' : 'Select' }}
              </v-button>
            </div>
          </div>
          <div class="option" data-cy="llm-modal-option" data-option="default">
            <div class="description">
              <h1>Use the AppMap hosted provider</h1>
              <p>Instantly get access to Navie without any additional configuration.</p>
            </div>
            <div class="action">
              <v-button
                size="medium"
                kind="native"
                @click.native="selectOption('default')"
                :disabled="selectedOption === 'default'"
                data-cy="llm-select"
              >
                {{ selectedOption === 'default' ? 'Selected' : 'Select' }}
              </v-button>
            </div>
          </div>
          <div class="option" data-cy="llm-modal-option" data-option="byok">
            <div class="description">
              <h1>Use your own OpenAI API key</h1>
              <p>Input your own OpenAI API key to use it with Navie.</p>
            </div>
            <div class="action">
              <v-button
                size="medium"
                kind="native"
                @click.native="selectOption('own-key')"
                data-cy="llm-select"
              >
                Select
              </v-button>
            </div>
          </div>
          <div class="option">
            <div class="description">
              <h1>Use your own model</h1>
              <p>
                Configure Navie to use a specific LLM by adjusting the environment variables used by
                the AppMap extension.
              </p>
              <p>Selecting this option will open the documentation in a new tab.</p>
            </div>
            <div class="action">
              <a
                href="https://appmap.io/docs/navie/bring-your-own-model.html"
                target="_blank"
                data-cy="llm-modal-option"
                data-option="byom"
              >
                <v-button
                  size="medium"
                  kind="native"
                  @click.native="selectOption('own-model')"
                  data-cy="llm-select"
                >
                  Select
                </v-button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </v-modal>
    <template v-if="isLoading">
      <div class="skeleton-loader" data-cy="loading" />
    </template>
    <template v-else-if="vsCodeLMVendor">
      <v-copilot-notice :subscription="subscription" :email="email" @on-configure="showModal" />
    </template>
    <template v-else>
      <div class="llm-configuration__container">
        <v-subscription-status
          class="subscription-status"
          :subscription="subscription"
          :email="email"
          v-if="displaySubscription"
        />
        <div
          :class="{
            'llm-configuration__indicator': 1,
            'llm-configuration__indicator--no-subscription': !displaySubscription,
          }"
        >
          <v-button
            v-if="!vsCodeLMVendor"
            kind="native-ghost"
            class="button"
            @click.native="showModal"
            data-cy="llm-config-button"
          >
            <v-cog-solid class="icon" />
          </v-button>
          <span>
            <b>Model:</b>
            <span class="llm-model-name" data-cy="llm-model">{{ modelName }}</span>
            <span class="llm-provider" data-cy="llm-provider">({{ modelSubtext }})</span>
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import VButton from '@/components/Button.vue';
import VCogSolid from '@/assets/cog-solid.svg';
import VModal from '@/components/Modal.vue';
import VCloseIcon from '@/assets/x-icon.svg';
import VCopilotNotice from '@/components/chat-search/CopilotNotice.vue';
import VSubscriptionStatus from '@/components/chat-search/SubscriptionStatus.vue';

type LLMConfigOption = 'default' | 'own-key' | 'own-model' | 'copilot';

export default Vue.extend({
  components: {
    VButton,
    VCogSolid,
    VModal,
    VCloseIcon,
    VCopilotNotice,
    VSubscriptionStatus,
  },

  props: {
    model: {
      type: String as PropType<string | undefined>,
      required: false,
    },
    baseUrl: {
      type: String as PropType<string | undefined>,
      required: false,
    },
    isLoading: {
      type: Boolean,
      required: false,
      default: false,
    },
    subscription: {
      type: Object,
    },
    email: {
      type: String,
    },
  },

  inject: {
    displaySubscription: {
      default: true,
    },
  },

  data() {
    return {
      modalVisible: false,
    };
  },

  computed: {
    isLocal() {
      return this.baseUrl !== undefined;
    },
    vsCodeLMVendor(): string | undefined {
      if (!this.baseUrl) return;
      const { hostname, pathname } = new URL(this.baseUrl);
      if (!['localhost', '127.0.0.1'].includes(hostname)) return;
      const vscodeVendor = pathname?.match(/\/vscode\/([^/]+)/);
      if (vscodeVendor && vscodeVendor[1]) return decodeURIComponent(vscodeVendor[1]);
      return undefined;
    },
    modelName(): string {
      return this.model ?? 'GPT-4o';
    },
    modelSubtext(): string {
      if (!this.baseUrl) return 'default';

      try {
        if (this.vsCodeLMVendor) return `via ${this.vsCodeLMVendor}`;
        const { hostname } = new URL(this.baseUrl);
        if (hostname.match(/(openai.azure.com|api.microsoft.com)$/i) !== null) {
          return 'via Azure OpenAI';
        }

        if (hostname.match(/^api.openai.com$/i) !== null) {
          return 'via OpenAI';
        }

        if (hostname.match(/^(localhost|127.0.0.1)$/i) !== null) {
          return 'via localhost';
        }

        return hostname;
      } catch {
        return 'default';
      }
    },
    selectedOption(): 'default' | 'copilot' | 'other' {
      if (this.vsCodeLMVendor) return 'copilot';
      return this.isLocal ? 'other' : 'default';
    },
    isSubscribed(): boolean {
      return this.subscription?.subscriptions?.length > 0;
    },
  },

  methods: {
    showModal() {
      this.modalVisible = true;
    },
    hideModal() {
      this.modalVisible = false;
    },
    selectOption(option: LLMConfigOption) {
      this.$root.$emit('select-llm-option', option);
      this.hideModal();
    },
  },
});
</script>

<style lang="scss" scoped>
.llm-configuration {
  display: flex;
  flex-direction: column;

  width: fit-content;
  color: $color-foreground;

  &__container {
    display: flex;
    flex-direction: column;
    background-color: $color-background-dark;
    border-radius: $border-radius;
    border: 1px solid $color-border;

    .subscription-status {
      padding: 0.5rem;
    }
  }

  a {
    color: $color-link;
    text-decoration: none;
    &:hover {
      color: $color-link-hover;
      text-decoration: underline;
    }
  }

  .skeleton-loader {
    @keyframes skeleton {
      0% {
        background-position: -100% 0%;
      }
      100% {
        background-position: 100% 0%;
      }
    }

    $alpha: 0.075;
    width: 15em;
    height: 4em;
    border-radius: $border-radius;
    background-color: rgba(black, 0.1);
    background: linear-gradient(
      90deg,
      rgba(black, $alpha) 0%,
      rgba(white, $alpha) 50%,
      rgba(black, $alpha) 100%
    );
    border: 1px solid rgba(white, 0.025);
    background-size: 200% 100%;
    animation: skeleton 3s linear infinite;
  }

  &__indicator {
    padding: 1rem;
    border-radius: 0 0 $border-radius $border-radius;
    background-color: $color-background-dark;
    border-top: 1px solid $color-border;

    &--no-subscription {
      border-top: none;
      border-radius: $border-radius;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    max-width: 32rem;
    margin: auto;
  }

  .button {
    padding: 0.5rem;

    &:hover {
      background-color: $color-background-light;
    }
  }
  .config-header {
    position: relative;

    .close-icon {
      position: absolute;
      bottom: 1rem;
      right: 0;
      cursor: pointer;
      fill: #868789;
      width: 18px;
      height: 18px;
      &:hover {
        fill: #e3e5e8;
        transition: all 0.2s ease-in-out;
      }
    }
  }
  .icon {
    width: 14px;
    fill: #e3e5e8;
  }

  .llm-provider {
    opacity: 0.5;
    padding-left: 0;
  }

  span {
    padding-left: 0.5rem;
  }

  .llm-model-name {
    padding-left: 0;
  }

  .config-options {
    background-color: $color-background;
    padding: 1em;
    border-radius: $border-radius;
    border: 1px solid $color-background-light;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    a:-webkit-any-link {
      text-decoration: none;
      color: inherit;
    }

    .option {
      display: flex;
      flex-direction: row;
      padding: 1em;
      border-bottom: 1px solid $color-background-light;
      gap: 1em;

      &:last-child {
        border-bottom: none;
      }

      .description {
        flex-grow: 1;
      }

      .action {
        flex-shrink: 0;
        align-content: center;
      }

      h1 {
        font-size: 16px;
        margin: 0 0 0.5rem 0;
      }

      p {
        opacity: 0.8;
        margin: 0 0 0.5rem 0;
      }
    }
  }
}
</style>
