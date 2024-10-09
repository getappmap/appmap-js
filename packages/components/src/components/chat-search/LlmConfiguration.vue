<template>
  <div class="llm-configuration">
    <v-modal v-if="modalVisible" @close="hideModal" data-cy="llm-config-modal">
      <div class="llm-configuration__content">
        <div class="config-header">
          <h1>LLM Configuration</h1>
          <v-close-icon class="close-icon" @click="hideModal" />
        </div>
        <div class="config-options">
          <div class="option" data-cy="llm-modal-option" data-option="default">
            <div class="description">
              <h1>Use the Navie backend</h1>
              <p>Instantly get access to Navie without any additional configuration.</p>
            </div>
            <div class="action">
              <v-button
                size="medium"
                @click.native="selectOption('default')"
                :disabled="!isLocal"
                data-cy="llm-select"
              >
                {{ isLocal ? 'Select' : 'Selected' }}
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
                  @click.native="selectOption('own-model')"
                  data-cy="llm-select"
                >
                  Select
                </v-button>
              </a>
            </div>
          </div>
          <div class="option" data-cy="llm-modal-option" data-option="byok">
            <div class="description">
              <h1>Use your own OpenAI API key</h1>
              <p>Input your own OpenAI API key to use it with Navie.</p>
            </div>
            <div class="action">
              <v-button size="medium" @click.native="selectOption('own-key')" data-cy="llm-select">
                Select
              </v-button>
            </div>
          </div>
        </div>
      </div>
    </v-modal>
    <template v-if="vsCodeLMVendor">
      <v-copilot-notice @on-configure="showModal" />
    </template>
    <template v-else>
      <div class="llm-configuration__indicator">
        <v-button
          v-if="!vsCodeLMVendor"
          kind="ghost"
          class="button"
          @click.native="showModal"
          data-cy="llm-config-button"
        >
          <v-cog-solid class="icon" />
        </v-button>
        <span>
          <b>Model:</b>
          <span class="llm-model-name" data-cy="llm-model">{{ modelName }}</span>
          <i data-cy="llm-provider">({{ modelSubtext }})</i>
        </span>
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

type LLMConfigOption = 'default' | 'own-key' | 'own-model';

export default Vue.extend({
  components: {
    VButton,
    VCogSolid,
    VModal,
    VCloseIcon,
    VCopilotNotice,
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
  padding: 1rem;
  width: fit-content;
  font-size: 12px;

  &__indicator {
    padding: 1rem;
    align-items: center;
    border-radius: $border-radius;
    background-color: #32354d;
    border: 1px solid rgba(255, 255, 255, 0.1);
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
      background-color: #32354d;
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

  i {
    opacity: 0.5;
  }
  span {
    padding-left: 0.5rem;
  }

  .llm-model-name {
    padding-left: 0;
  }

  .config-options {
    $bg: #32354d;
    background-color: $bg;
    padding: 1em;
    border-radius: $border-radius;
    border: 1px solid desaturate(lighten($bg, 15%), 10%);
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
      border-bottom: 1px solid desaturate(lighten($bg, 15%), 10%);
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

      a {
        text-decoration: none;
        color: desaturate($brightblue, 30%);

        &:hover,
        &:active {
          color: $brightblue;
          text-decoration: underline;
        }
      }
    }
  }
}
</style>
