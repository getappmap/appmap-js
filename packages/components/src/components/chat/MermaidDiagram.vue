<template>
  <div class="mermaid-diagram" data-cy="mermaid-diagram">
    <div class="mermaid-diagram__container">
      <div class="mermaid-diagram__buttons">
        <v-popper
          v-if="externalLink"
          text="Open in Mermaid live editor"
          placement="top"
          text-align="left"
          align="left"
        >
          <a class="button" data-cy="open-external" :href="externalLink" target="_blank">
            <v-external-link-icon />
          </a>
        </v-popper>
        <v-popper
          text="Copy Mermaid definitions"
          placement="top"
          text-align="left"
          align="left"
          ref="copyPopper"
        >
          <span class="button" v-if="svg" data-cy="copy" @click="copy">
            <v-copy-icon :style="{ transform: 'scale(1.15)' }" />
          </span>
        </v-popper>
        <v-popper text="Save" placement="top" text-align="left" align="left">
          <span class="button" v-if="svg" data-cy="download" @click="download">
            <v-download-icon :style="{ transform: 'scale(1.4)' }" />
          </span>
        </v-popper>
        <v-popper text="Expand" placement="top" text-align="left" align="left">
          <span class="button" data-cy="expand" @click="showModal">
            <v-full-screen-icon :style="{ transform: ' scale(1.3)' }" />
          </span>
        </v-popper>
      </div>
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
</template>

<script lang="ts">
import Vue from 'vue';
import mermaid from 'mermaid';
import VModal from '@/components/Modal.vue';
import VFullScreenIcon from '@/assets/fullscreen.svg';
import VDownloadIcon from '@/assets/download.svg';
import VExternalLinkIcon from '@/assets/external-link.svg';
import VCopyIcon from '@/assets/clipboard.svg';
import VCloseIcon from '@/assets/x-icon.svg';
import VPopper from '@/components/Popper.vue';
import downloadSvg from '@/lib/downloadSvg';
import pako from 'pako';
import { fromUint8Array } from 'js-base64';

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
    VFullScreenIcon,
    VDownloadIcon,
    VCopyIcon,
    VPopper,
    VCloseIcon,
    VExternalLinkIcon,
  },
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
    return {
      id: `mermaid-${diagramId++}`,
      definition: this.$slots.default?.[0]?.text,
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
      (this.$refs.copyPopper as any).flash('Copied to clipboard!');
    },
  },
});
</script>

<style lang="scss" scoped>
.mermaid-diagram {
  margin: 1rem 0;

  &:last-child {
    margin-bottom: 0;
  }

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
  }

  &__container {
    overflow: visible;
    background-color: rgba(black, 0.5);
    border-radius: $border-radius;
    border: 1px solid rgba(white, 0.15);
    padding: 1rem;
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
