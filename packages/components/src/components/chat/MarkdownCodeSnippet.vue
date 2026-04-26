<template>
  <v-context-container
    :title="header"
    :uri="uri"
    :location="decodedLocation"
    :directory="directory"
    :is-pinnable="isPinnable"
    :is-reference="isReference"
    content-type="text"
    data-cy="code-snippet"
    class="code-snippet"
    @copy="copyToClipboard"
    @pin="onPin"
    @apply="onApply"
  >
    <pre
      class="hljs"
    ><code data-cy="content"  v-html="highlightedCode" /><slot name="cursor" /></pre>
  </v-context-container>
</template>

<script lang="ts">
import VContextContainer from '@/components/chat/ContextContainer.vue';
import ContextItemMixin from '@/components/mixins/contextItem';
import AppMapRPC from '@/lib/AppMapRPC';
import { defineComponent, type PropType, type VNode } from 'vue';

import hljs from 'highlight.js';
import stripCodeFences from '@/lib/stripCodeFences';
import { URI } from '@appland/rpc';
import eventBus from '@/lib/eventBus';

hljs.registerAliases(['rake', 'Gemfile'], { languageName: 'ruby' });
hljs.registerAliases(['vue'], { languageName: 'xml' });

interface Injected {
  rpcClient: AppMapRPC;
  projectDirectories: string[];
}

export default defineComponent({
  props: {
    language: String,
    location: String as PropType<string | undefined>,
    uri: String,
    directory: String,
    isPinnable: {
      type: Boolean,
      default: true,
    },
  },
  mixins: [ContextItemMixin],
  inject: {
    rpcClient: {
      default: () => ({
        // Cosmetic placeholder
        update: () =>
          new Promise((resolve, reject) =>
            setTimeout(Math.random() > 0.5 ? resolve : reject, 1000)
          ),
      }),
    },
    projectDirectories: {
      default: () => [] as string[],
    },
  },
  components: {
    VContextContainer,
  },
  data() {
    return {
      code: stripCodeFences(this._slotText()),
      pendingApply: false,
    };
  },
  computed: {
    uriComponents(): URI | undefined {
      if (this.uri) {
        try {
          return URI.parse(this.uri);
        } catch (e) {
          console.error('Invalid URI:', this.uri, e);
        }
      }
      return undefined;
    },
    highlightedCode(): string {
      let language = hljs.getLanguage(this.language) ? this.language : 'plaintext';
      return hljs.highlight(language, this.code).value;
    },
    header(): string {
      return this.title ?? this.shortPath ?? this.language;
    },
    // `shortPath` is the relative path... or not. If we can't find a matching
    // project directory, we'll just return the full path, what ever it may be.
    shortPath(): string | undefined {
      if (!this.decodedLocation) return undefined;

      const { projectDirectories } = this as unknown as Injected;
      const projectDirectory = projectDirectories.find((dir) =>
        this.decodedLocation?.startsWith(dir)
      );
      if (!projectDirectory) return this.decodedLocation;

      // The substring removes the leading slash.
      // E.g., given the project directory `/home/user/dev/my-project` and the
      // location `/home/user/dev/my-project/app/models/user.rb`, the result of
      // the replace would be `/app/models/user.rb`.
      return this.decodedLocation?.replace(projectDirectory, '').substring(1);
    },
    decodedLocation(): string | undefined {
      // The location may be URI encoded to avoid issues with special characters.
      // This field is only used for context search results and should be switched
      // to a URI.
      if (this.location) {
        try {
          return decodeURIComponent(this.location);
        } catch (e) {
          console.error('Invalid location:', this.location, e);
        }
      }

      if (this.uriComponents?.scheme === 'file') {
        return this.uriComponents.fsPath;
      }

      return undefined;
    },
    change: function (): VNode | undefined {
      return this.$slots.default?.().find(({ type }) => type === 'change');
    },
    original: function (): string | undefined {
      const children = this.change?.children as VNode[] | undefined;
      const orig = children?.find(({ type }) => type === 'original');
      const origChildren = orig?.children as VNode[] | undefined;
      const textNode = origChildren?.[0];
      return typeof textNode?.children === 'string' ? textNode.children : undefined;
    },
    modified: function (): string | undefined {
      const children = this.change?.children as VNode[] | undefined;
      const mod = children?.find(({ type }) => type === 'modified');
      const modChildren = mod?.children as VNode[] | undefined;
      const textNode = modChildren?.[0];
      return typeof textNode?.children === 'string' ? textNode.children : undefined;
    },
  },
  methods: {
    _slotText(): string {
      const nodes = this.$slots.default?.();
      if (!nodes?.length) return '';
      // Slots may be wrapped in a Fragment vnode; unwrap one level
      const first = nodes[0];
      const candidates = Array.isArray(first.children)
        ? (first.children as any[])
        : [first];
      for (const node of candidates) {
        if (typeof node.children === 'string') return node.children;
      }
      return '';
    },
    copyToClipboard(): void {
      if (!this.code) return;

      let code = this.modified ?? this.code;
      // ensure there's a final newline
      if (!code.endsWith('\n')) code += '\n';

      navigator.clipboard.writeText(code);
    },
    onPin({ pinned, uri }: { pinned: boolean; uri: string }): void {
      eventBus.emit('pin', { pinned, uri });
    },
    async onApply(resultCallback: (result: 'success' | 'failure') => void): Promise<void> {
      if (this.pendingApply) return;
      if (!this.decodedLocation) return;

      eventBus.emit('apply', this.decodedLocation, this.code);

      const { rpcClient } = this as unknown as Injected;
      this.pendingApply = true;
      try {
        await rpcClient.update(this.decodedLocation, this.modified ?? this.code, this.original);
        resultCallback('success');
      } catch (e) {
        resultCallback('failure');
        console.error(e);
        return;
      } finally {
        this.pendingApply = false;
      }
    },
  },
  updated() {
    // Slots are not reactive unless written directly to the DOM.
    // Luckily for us, this method is called when the content within the slot changes.
    this.code = stripCodeFences(this._slotText());
  },
});
</script>

<style lang="scss" scoped>
.code-snippet {
  :deep(pre) {
    margin: 0;
    border: 0;
    border-radius: 0 0 $border-radius $border-radius;
    padding: 0.5rem 1rem 0.25rem 1rem;
    overflow: auto;
  }

  :deep(code) {
    line-height: 1.6;
  }
}
</style>
