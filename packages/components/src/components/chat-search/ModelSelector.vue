<template>
  <div class="model-selector">
    <v-popper ref="config" :hoverable="false" class="popper" placement="bottom" align="left">
      <v-cog-solid
        @click.prevent.stop="showPopper($refs.config)"
        class="model-selector__config-button"
      />
      <template #content>
        <div class="model-selector-config">
          <h2>Configuration</h2>
          <div class="model-selector-config__group">
            <h3>OpenAI</h3>
            <div class="model-selector-config__item">
              <span class="model-selector-config__item--title">API Key</span>
              <input
                class="model-selector-config__text-input"
                type="password"
                @click.prevent.stop
                @input="onInput"
                @change="onChangeValue($event, 'OPENAI_API_KEY')"
                @focus="selectAll($event.target)"
                placeholder="OpenAI API Key"
                data-secret
                :data-clear="Boolean(configMap.openai && configMap.openai.apiKey)"
                :value="configMap.openai && configMap.openai.apiKey"
              />
            </div>
            <div class="model-selector-config__item">
              <span class="model-selector-config__item--title">API URL</span>
              <input
                class="model-selector-config__text-input"
                @click.prevent.stop
                placeholder="http://api.openai.com/v1"
                @change="onChangeValue($event, 'OPENAI_BASE_URL')"
                :value="configMap.openai && configMap.openai.endpoint"
              />
            </div>
          </div>
          <div class="model-selector-config__group">
            <h3>Anthropic</h3>
            <div class="model-selector-config__item">
              <span class="model-selector-config__item--title">API Key</span>
              <input
                class="model-selector-config__text-input"
                type="password"
                @click.prevent.stop
                @input="onInput"
                @change="onChangeValue($event, 'ANTHROPIC_API_KEY')"
                @focus="selectAll($event.target)"
                placeholder="Anthropic API Key"
                data-secret
                :data-clear="Boolean(configMap.anthropic && configMap.anthropic.apiKey)"
                :value="configMap.anthropic && configMap.anthropic.apiKey"
              />
            </div>
          </div>
          <div class="model-selector-config__group">
            <h3>Ollama</h3>
            <div class="model-selector-config__item">
              <span class="model-selector-config__item--title">Ollama Host URL</span>
              <input
                class="model-selector-config__text-input"
                @click.prevent.stop
                @change="onChangeValue($event, 'OLLAMA_BASE_URL')"
                placeholder="http://localhost:11434"
                :value="configMap.ollama && configMap.ollama.endpoint"
              />
            </div>
          </div>
        </div>
      </template>
    </v-popper>
    <v-popper ref="dropdown" :hoverable="false" class="popper" placement="bottom" align="left">
      <div
        class="model-selector__dropdown"
        @click.prevent.stop="showPopper($refs.dropdown)"
        data-cy="model-selector"
      >
        <span class="model-selector__title" data-cy="selected-model">
          <template v-if="selectedModel">
            {{ selectedModel.name }}
            <span class="model-selector__title--provider">via {{ selectedModel.provider }}</span>
          </template>
          <template v-else> Select a model </template>
          <v-chevron-down class="model-selector__chevron" />
        </span>
      </div>
      <template #content>
        <div class="model-selector-list" v-if="sortedModels.length">
          <div
            :class="getListModelClasses(model)"
            data-cy="model-selector-item"
            v-for="model in sortedModels"
            :key="`${model.provider}:${model.id}`"
            @click="onSelect(model)"
          >
            <span class="model-selector-list__item--title">
              {{ model.name }}
              <v-badge v-for="tag in filterTags(model)" :key="tag" :class="badgeClass(tag)">
                {{ tag }}
              </v-badge>
            </span>
            <span class="model-selector-list__item--description">{{ model.provider }}</span>
          </div>
        </div>
        <div class="model-selector-config" v-else>
          <div class="model-selector__no-models">
            <h2>No models are available</h2>
            <p>
              To get started, click the gear icon <v-cog-solid class="icon-inline" /> to configure
              your API keys for:
            </p>
            <ul>
              <li>OpenAI</li>
              <li>Anthropic</li>
            </ul>
            <p>
              If you're using Ollama, make sure it is running. If your Ollama service runs on a
              non-default port, change the Ollama Host URL in the configuration menu.
            </p>
            <p>
              <strong>Alternatively</strong>, install and sign in to GitHub Copilot. Models provided
              by GitHub Copilot will be automatically become available.
            </p>
          </div>
        </div>
      </template>
    </v-popper>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import VPopper from '@/components/Popper.vue';
import VChevronDown from '@/assets/fa-solid_chevron-down.svg';
import VCogSolid from '@/assets/cog-solid.svg';
import VBadge from '@/components/Badge.vue';
import type { NavieRpc } from '@appland/rpc';

export default Vue.extend({
  components: {
    VPopper,
    VChevronDown,
    VCogSolid,
    VBadge,
  },

  props: {
    models: {
      type: Array as PropType<NavieRpc.V1.Models.ListModel[]>,
      default: () => [],
    },
    selectedModel: {
      type: Object as PropType<NavieRpc.V1.Models.ListModel | undefined>,
    },
    modelConfigs: {
      type: Array as PropType<NavieRpc.V1.Models.Config[]>,
      default: () => [],
    },
  },

  data() {
    return {
      hidePoppers: (() => {}) as () => void,
      clearedInputs: new Set<HTMLInputElement>(),
    };
  },

  computed: {
    configMap(): Record<string, NavieRpc.V1.Models.Config> {
      return this.modelConfigs.reduce((map, config) => {
        map[config.provider] = config;
        return map;
      }, {} as Record<string, NavieRpc.V1.Models.Config>);
    },
    sortedModels(): NavieRpc.V1.Models.Model[] {
      return [...this.models].sort((a, b) => {
        const provider = a.provider.localeCompare(b.provider);
        if (provider !== 0) return provider;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },
  },

  methods: {
    getModelId(model?: NavieRpc.V1.Models.ListModel) {
      if (model) {
        return `${model.provider.toLowerCase()}:${model.id.toLowerCase()}`;
      }
    },
    getListModelClasses(model: NavieRpc.V1.Models.ListModel) {
      const selectedModelId = this.getModelId(this.selectedModel);
      return {
        'model-selector-list__item': true,
        'model-selector-list__item--selected':
          selectedModelId && selectedModelId === this.getModelId(model),
      };
    },
    filterTags(model: NavieRpc.V1.Models.ListModel) {
      return model.tags?.filter((tag) => !['primary', 'secondary'].includes(tag)) ?? [];
    },
    badgeClass(tag: string) {
      return {
        badge: true,
        'badge--recommended': tag === 'recommended',
        'badge--alpha': tag === 'alpha',
      };
    },
    onSelect(model: NavieRpc.V1.Models.Model) {
      this.$emit('select', model.provider, model.id);
      if (this.$refs.popper) {
        const popper = this.$refs.popper as any;
        popper.hide();
      }
    },
    _hidePoppers() {
      window.removeEventListener('click', this.hidePoppers);
      [this.$refs.dropdown, this.$refs.config].forEach((popper: any) => {
        if (popper && popper.isVisible) {
          popper.hide();
        }
      });
    },
    showPopper(popper: any) {
      if (popper.isVisible) {
        popper.hide();
        return;
      }

      // Make sure only one popper is visible at a time
      this.hidePoppers();

      popper.show();
      window.addEventListener('click', this.hidePoppers);
    },
    selectAll(element: EventTarget | null) {
      if (element instanceof HTMLInputElement) {
        element.select();
      }
    },
    // If an input contains an asterisk'd value, fully clear it.
    // We don't want the user expecting the real value to be there.
    onInput(event: Event) {
      if (!(event instanceof InputEvent)) {
        return;
      }

      const input = event.target as HTMLInputElement;
      if (input.getAttribute('data-clear') === null) {
        return;
      }

      if (this.clearedInputs.has(input)) {
        return;
      }

      input.value = event.data ?? '';
      this.clearedInputs.add(input);
    },
    onChangeValue(event: Event, key: string) {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) {
        return;
      }

      const isSecret = input.getAttribute('data-secret') !== null;

      this.$root.$emit('change-model-config', {
        key,
        value: input.value,
        secret: isSecret,
      });
    },
  },
  mounted() {
    this.hidePoppers = this._hidePoppers.bind(this);
  },
});
</script>

<style lang="scss" scoped>
.popper {
  ::v-deep {
    .popper__text {
      padding: 0;
      background-color: $color-background;
      border: none;
      max-width: unset;
      border-radius: $border-radius;
      pointer-events: all;

      &--align-left {
        left: 0;
        transform: none;
      }
    }
  }
}

.badge {
  margin: 0 0.25em;
  line-height: 1.6;

  &--recommended {
    background-color: $color-highlight;
    color: $color-foreground-light;
  }
  &--alpha {
    background-color: $color-background-light !important;
    color: $color-background !important;
  }
}

.model-selector {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  padding: 1rem 1rem 0.5rem 1rem;
  position: relative;

  &__drop-down {
    padding: 0;
  }

  &__config-button {
    cursor: pointer;
    width: 1.2em;
    height: 1.2em;

    path {
      fill: $color-foreground;
      transform-origin: center;
      transition: all 0.1s ease-in;
    }

    &:hover {
      path {
        fill: $color-highlight;
      }
    }

    &:active {
      path {
        fill: $color-highlight;
        transform: rotate(60deg);
      }
    }
  }

  &__title {
    display: flex;
    gap: 0.25rem;
    align-items: center;
    font-weight: 600;
    font-size: 1rem;
    color: $color-foreground;
    cursor: pointer;

    &--provider {
      padding-top: 2px;
      font-weight: 400;
      font-size: 0.8em;
    }

    svg path {
      fill: $color-foreground;
    }

    &:hover {
      color: $color-highlight;
      svg path {
        fill: $color-highlight;
      }
    }
  }

  &__chevron {
    width: 0.8em;
    height: 0.8em;
    padding-top: 3px;
  }
}

.model-selector__no-models {
  padding-top: 0.5em;
  max-width: 32em;

  p {
    font-size: 1em;
    margin: 0.5em 0;
  }

  ul {
    margin-top: 0.5em;
    margin-left: 0;
    padding-left: 1.5em;
  }
}

.icon-inline {
  width: 1.2em;
  height: 1.2em;
}

.model-selector-config {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 1rem 1rem 1rem;
  background-color: $color-background-light;
  min-width: 32em;
  border-radius: $border-radius;
  border: 1px solid $color-border;
  max-height: calc(100vh - 6em);
  overflow-y: auto;

  h2 {
    margin: 0;
  }

  &__group {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
    border-top: 1px solid $color-border;
    padding-top: 0.5em;

    h3 {
      margin: 0;
      padding-bottom: 0.25em;
    }
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &--title {
      padding-left: 0.65em;
      font-weight: 400;
      font-size: 0.9em;
      color: $color-foreground-light;
    }
  }

  &__item &__text-input {
    border-radius: $border-radius;
    font-size: 1.2em;
    height: 2em;
    border: 1px solid $color-border;
    border-radius: $border-radius;
    background-color: $color-input-bg;
    color: $color-input-fg;
    padding: 0 0.5em;
    user-select: all;

    &:focus {
      outline: none;
      border-color: $color-highlight;
    }
  }
}

.model-selector-list {
  display: flex;
  overflow-y: auto;
  max-height: 30rem;
  pointer-events: all;
  flex-direction: column;
  gap: 1px;
  border-radius: $border-radius;
  border: 1px solid $color-border;
  background-color: $color-background-light;
  max-height: calc(100vh - 6em);
  overflow-y: auto;

  &__item {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;
    padding: 0.5rem;
    place-content: space-between;

    cursor: pointer;

    &:hover {
      background-color: $color-highlight;
    }

    &--selected {
      background-color: $color-button-bg-hover;
    }

    &--title {
      font-weight: 600;
      font-size: 1rem;
      color: $color-foreground-light;
    }

    &--description {
      font-size: 0.8rem;
      opacity: 0.8;
      color: $color-foreground-dark;
    }
  }
}
</style>
