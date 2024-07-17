<template>
  <div class="context" data-cy="context">
    <template v-if="!contextResponse">
      <div class="context__notice-container">
        <div class="context__notice" data-cy="context-notice">
          <h2>Navie's context</h2>
          <p>
            When you ask Navie a question, this area will reflect the information that Navie is
            aware of when answering. You can use this information to better understand how Navie is
            responding.
          </p>
        </div>
      </div>
    </template>
    <template v-else>
      <div>
        <h2>Context</h2>
        <div class="context__body">
          <div
            v-if="numAppMaps === 0"
            class="context__body__no-appmaps"
            data-cy="create-appmap-data"
          >
            <p>
              You don't have any AppMap data. Adding AppMap data to Navie's context improves Navie's
              code suggestions and answers.
            </p>
            <v-button
              data-cy="create-appmap-data-btn"
              class="create-appmap-data"
              size="small"
              kind="ghost"
              @click.native="openInstallInstructions"
            >
              Open Instructions
            </v-button>
          </div>
          <template v-if="pinnedItems && pinnedItems.length">
            <h3>Pinned Items</h3>
            <div v-for="pin in pinnedItems" :key="pin.handle">
              <component
                :is="getPinnedComponent(pin)"
                :is-reference="true"
                v-bind="pin"
                @pin="unpin(pin.handle)"
              >
                {{ pin.content }}
              </component>
            </div>
          </template>
          <div v-for="t in Object.keys(contextTypes)" :key="t">
            <div v-if="hasContext(t)">
              <h3>
                {{ contextTypes[t] }}
                <span class="context__count">{{ contextItemCount(t) }}</span>
              </h3>
              <div class="context__body__table">
                <v-context-item
                  v-for="(contextItem, index) in contextItems(t)"
                  :key="index"
                  :contextItem="contextItem"
                  data-cy="context-item"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VContextItem from '@/components/chat-search/ContextItem.vue';
import VMarkdownCodeSnippet from '@/components/chat/MarkdownCodeSnippet.vue';
import VMermaidDiagram from '@/components/chat/MermaidDiagram.vue';
import VButton from '@/components/Button.vue';

const PinnedContextComponents = {
  'code-snippet': VMarkdownCodeSnippet,
  mermaid: VMermaidDiagram,
};

export default {
  name: 'v-context',

  components: {
    VContextItem,
    VButton,
    VMarkdownCodeSnippet,
    VMermaidDiagram,
  },

  props: {
    appmapStats: {
      type: Array,
      required: false,
    },
    contextResponse: {
      type: Array,
      required: false,
    },
    pinnedItems: {
      type: Array,
      required: false,
    },
  },

  computed: {
    numAppMaps() {
      return (this.appmapStats || []).reduce((acc, { numAppMaps }) => acc + numAppMaps, 0);
    },
    contextTypes() {
      return {
        'sequence-diagram': 'Sequence Diagrams',
        'data-request': 'Data Requests',
        'code-snippet': 'Code Snippets',
      };
    },
    contextTypeKeys() {
      return Object.keys(this.contextTypes);
    },
  },

  methods: {
    hasContext(type: string) {
      return this.contextResponse.some((context) => context.type === type);
    },
    contextItems(type: string) {
      return this.contextResponse.filter((context) => context.type === type);
    },
    contextItemCount(type: string) {
      return this.contextItems(type).length;
    },
    openInstallInstructions() {
      this.$root.$emit('open-install-instructions');
    },
    getPinnedComponent({ type }: any): Vue.Component | undefined {
      return PinnedContextComponents[type];
    },
    unpin(handle: number) {
      this.$emit('pin', { handle, pinned: false });
    },
  },
};
</script>

<style lang="scss" scoped>
.context {
  font-size: 0.9rem;
  color: $gray4;
  width: 100%;
  min-height: 100%;

  &__count {
    font-size: 0.8rem;
    font-weight: 400;
    color: lighten($gray4, 20%);
    margin-left: 0.5rem;
    background-color: rgb(168, 168, 255, 0.15);
    border-radius: 4rem;
    width: 1.25rem;
    height: 1.25rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }

  h2 {
    margin-top: 0;
    margin-bottom: 2rem;
    color: $white;
  }

  h3 {
    color: $gray5;
  }

  &__body {
    &__no-appmaps {
      padding: 0 1rem;
      margin-bottom: 2.5rem;
    }

    &__table {
      display: flex;
      flex-direction: column;
      padding: 0.25rem 0.5rem;
      margin-bottom: 2.5rem;

      & > * {
        border-bottom: 1px solid $gray2;
      }

      & > *:last-child {
        border-bottom: none;
      }
    }
  }

  &__notice-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  &__notice {
    $fg: rgb(255, 255, 255, 0.75);

    margin: 0 auto;
    width: 40%;
    min-width: 180px;
    background-color: rgb(0, 0, 0, 0.25);
    border: 1px solid rgb(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    padding: 1rem;
    color: $fg;
    line-height: 1.5;

    h2 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      color: $fg;
    }
  }
}
</style>
