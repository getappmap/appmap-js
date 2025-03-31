<template>
  <v-context-container
    :title="title"
    :menu-items="menuItems"
    :uri="uri"
    :is-reference="isReference"
    content-type="image"
    @expand="showModal"
    @pin="onPin"
  >
    <div class="mermaid-diagram" data-cy="mermaid-diagram">
      <div class="mermaid-diagram__container">
        <div v-html="svg" class="mermaid-diagram__svg" data-cy="graphic" />
      </div>
      <v-modal v-if="modalVisible" @close="hideModal" data-cy="diagram-modal">
        <div class="mermaid-diagram__modal">
          <div class="mermaid-diagram__buttons">
            <span class="button" data-cy="expand-close" @click="hideModal">
              <v-close-icon />
            </span>
          </div>
          <div v-html="svg" class="mermaid-diagram__modal-svg" />
        </div>
      </v-modal>
    </div>
  </v-context-container>
</template>

<script lang="ts">
import Vue from 'vue';
import mermaid from 'mermaid';
import VModal from '@/components/Modal.vue';
import VCloseIcon from '@/assets/x-icon.svg';
import VContextContainer from '@/components/chat/ContextContainer.vue';
import downloadSvg from '@/lib/downloadSvg';
import ContextItemMixin from '@/components/mixins/contextItem';
import pako from 'pako';
import { fromUint8Array } from 'js-base64';

import type ContextContainerMenuItem from './ContextContainerMenuItem';
import type { PinEvent } from './PinEvent';
import stripCodeFences from '@/lib/stripCodeFences';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    background: '#14161c',
    primaryColor: '#7289c5',
    mainBkg: '#0d0f16',
    border1: '#485475',
    labelBackground: '#14161c',
    edgeLabelBackground: '#14161c',
  },
});

let diagramId = 0;

export default Vue.extend({
  components: {
    VModal,
    VCloseIcon,
    VContextContainer,
  },
  mixins: [ContextItemMixin],
  watch: {
    definition: {
      handler: async function () {
        if (!this.definition) return;

        const isValid = await mermaid.parse(this.definition, { suppressErrors: true });
        if (!isValid) return;

        const { svg } = await mermaid.render(this.id, this.definition);
        this.svg = svg;
      },
      immediate: true,
    },
  },
  data() {
    let definition = stripCodeFences(this.$slots.default?.[0].text ?? '');
    return {
      definition,
      id: `mermaid-${diagramId++}`,
      svg: undefined as string | undefined,
      modalVisible: false,
    };
  },
  computed: {
    externalLink(): string | undefined {
      if (!this.definition) return;

      const data = JSON.stringify({
        code: this.definition,
        mermaid: {},
      });
      const utf8Encoded = new TextEncoder().encode(data);
      const compressed = pako.deflate(utf8Encoded, { level: 9 });
      const base64Encoded = fromUint8Array(compressed, true);
      return `https://mermaid.live/edit#pako:${base64Encoded}`;
    },
    menuItems(): ContextContainerMenuItem[] {
      return [
        {
          label: 'Open in Mermaid Live Editor',
          link: this.externalLink,
        },
        {
          label: 'Copy Mermaid definition',
          action: () => this.copy(),
        },
        {
          label: 'Export as PNG',
          action: () => this.download(),
        },
      ];
    },
    diagramType(): string | undefined {
      if (!this.definition) return;
      return this.definition.match(/\w+/)?.[0];
    },
    title(): string {
      switch (this.diagramType) {
        case 'flowchart':
          return 'Flowchart';
        case 'sequenceDiagram':
          return 'Sequence diagram';
        case 'classDiagram':
          return 'Class diagram';
        case 'stateDiagram':
          return 'State diagram';
        case 'erDiagram':
          return 'Entity relationship diagram';
        case 'stateDiagram-v2':
          return 'State diagram';
        case 'journey':
          return 'User journey';
        case 'C4Context':
          return 'C4 diagram';
        case 'mindmap':
          return 'Mindmap';
        default:
          return 'Mermaid diagram';
      }
    },
  },
  methods: {
    showModal() {
      this.modalVisible = true;
      document.body.style.overflow = 'hidden';
    },
    hideModal() {
      this.modalVisible = false;
      document.body.style.overflow = 'auto';
    },
    download() {
      if (!this.svg) return;

      downloadSvg(this.svg, `diagram-${Number(new Date())}.png`);
    },
    copy() {
      if (!this.svg || !this.definition) return;

      navigator.clipboard.writeText(this.definition);
    },
    onPin({ pinned, uri }: PinEvent) {
      this.$root.$emit('pin', { pinned, uri });
    },
  },
  updated() {
    // Slots are not reactive unless written directly to the DOM.
    // Luckily for us, this method is called when the content within the slot changes.
    this.definition = stripCodeFences(this.$slots.default?.[0].text ?? '');
  },
});
</script>

<style lang="scss" scoped>
.mermaid-diagram {
  &:v-deep {
    svg {
      width: 100%;
      height: 100%;
    }
  }

  &__svg {
    display: flex;
    width: 100%;
    place-content: center;
    background-color: #282a36; // snazzy
    border-radius: 0 0 $border-radius $border-radius;
  }

  &__modal {
    flex-direction: column;
    width: 100%;
    height: fit-content;
    pointer-events: none;
    overflow: scroll;
    max-height: 100vh;
    background: none;
    justify-content: center;
    align-self: center;
    padding: 1rem;
    pointer-events: auto;
    background-color: black;
    border-radius: $border-radius;
    border: 1px solid rgba(white, 0.15);

    .mermaid-diagram__buttons {
      position: sticky;
      top: 0rem;
    }

    -ms-overflow-style: none;
    scrollbar-width: none;
    ::-webkit-scrollbar {
      display: none;
    }

    ::v-deep {
      svg {
        width: 100%;
      }
    }
  }

  &__modal-svg {
    display: flex;
    justify-content: center;
  }

  &__buttons {
    display: flex;
    position: relative;
    justify-content: end;
    user-select: none;
    gap: 0.25rem;

    .button {
      display: flex;
      background-color: rgba(black, 0.1);
      border: 1px solid rgba(black, 0.2);
      border-radius: 3px;
      padding: 0.25rem;
      cursor: pointer;

      &:hover {
        background-color: rgba(white, 0.1);
        border-color: rgba(white, 0.2);

        svg {
          fill: rgba(white, 0.75);
          transform: scale(1.1);
          transform-origin: center;
        }
      }

      svg {
        width: 18px;
        height: 18px;
        fill: rgba(white, 0.25);
      }
    }
  }
}
</style>
