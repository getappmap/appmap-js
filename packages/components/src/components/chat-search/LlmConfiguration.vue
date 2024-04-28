<template>
  <div class="llm-configuration">
    <v-modal v-if="modalVisible" @close="hideModal" data-cy="llm-config-modal">
      <div class="config-options">
        <div
          class="option"
          v-if="isLocal"
          @click="selectOption('default')"
          data-cy="llm-modal-option"
          data-option="default"
        >
          <h1>Use the Navie backend</h1>
          <p>Instantly get access to Navie without any additional configuration.</p>
        </div>
        <a
          href="https://appmap.io/docs/navie/bring-your-own-model.html"
          target="_blank"
          data-cy="llm-modal-option"
          data-option="byom"
        >
          <div class="option">
            <h1>Use your own model</h1>
            <p>
              Configure Navie to use a specific LLM by adjusting the environment variables used by
              the AppMap extension.
            </p>
            <v-external-link class="icon right" />
          </div>
        </a>
        <div
          class="option"
          @click="selectOption('own-key')"
          data-cy="llm-modal-option"
          data-option="byok"
        >
          <h1>Use your own OpenAI API key</h1>
          <p>Input your own OpenAI API key to use it with Navie.</p>
        </div>
      </div>
    </v-modal>
    <v-button kind="ghost" class="button" @click.native="showModal" data-cy="llm-config-button">
      <v-cog-solid class="icon" />
    </v-button>
    <span>
      <b>Model:</b>
      <span class="llm-model-name" data-cy="llm-model">{{ modelName }}</span>
      <i data-cy="llm-provider">({{ modelSubtext }})</i>
    </span>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import VButton from '@/components/Button.vue';
import VCogSolid from '@/assets/cog-solid.svg';
import VModal from '@/components/Modal.vue';
import VExternalLink from '@/assets/external-link.svg';

type LLMConfigOption = 'default' | 'own-key' | 'own-model';

export default Vue.extend({
  components: {
    VButton,
    VCogSolid,
    VModal,
    VExternalLink,
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
    modelName(): string {
      return this.model ?? 'GPT-4 Turbo';
    },
    modelSubtext(): string {
      if (!this.baseUrl) return 'default';

      try {
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
  border-radius: $border-radius;
  background-color: #32354d;
  display: flex;
  padding: 1rem;
  width: fit-content;
  font-size: 12px;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);

  .button {
    padding: 0.5rem;

    &:hover {
      background-color: #32354d;
    }
  }
  .icon {
    width: 14px;
    fill: #e3e5e8;
  }
  .right {
    float: right;
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
    display: flex;
    flex-direction: column;
    gap: 1rem;

    a:-webkit-any-link {
      text-decoration: none;
      color: inherit;
    }

    .option {
      $bg: $gray2;
      background-color: $bg;
      padding: 2em 1em;
      border-radius: $border-radius;
      border: 1px solid desaturate(lighten($bg, 30%), 10%);
      cursor: pointer;

      &:hover {
        background-color: saturate(lighten($bg, 30%), 10%);
        transition: all 0.2s ease-in-out;
        color: white;
      }

      h1 {
        font-size: 16px;
        margin-bottom: 0.5rem;
      }
    }
  }
}
</style>
