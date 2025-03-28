<template>
  <v-context-container
    :title="header"
    :handle="handle"
    :location="decodedLocation"
    :directory="directory"
    :is-pinnable="isPinnable"
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
import Vue from 'vue';

import hljs from 'highlight.js';

hljs.registerAliases(['rake', 'Gemfile'], { languageName: 'ruby' });
hljs.registerAliases(['vue'], { languageName: 'xml' });

import type { PinCodeSnippet, PinEvent } from './PinEvent';

interface Injected {
  rpcClient: AppMapRPC;
  projectDirectories: string[];
}

const stripFileDirective = (code: string): string => code.replace(/^\s*?<!--\s*?file:.*?\n/, '');

export default Vue.extend({
  props: {
    language: String,
    title: String,
    location: String,
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
      code: stripFileDirective(this.$slots.default?.[0].text ?? ''),
      pendingApply: false,
    };
  },
  computed: {
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
      return this.location ? decodeURIComponent(this.location) : undefined;
    },
    change: function (): Vue.VNode | undefined {
      return this.$slots.default?.find(({ tag }) => tag === 'change');
    },
    original: function (): string | undefined {
      return this.change?.children?.find(({ tag }) => tag === 'original')?.children?.[0]?.text;
    },
    modified: function (): string | undefined {
      return this.change?.children?.find(({ tag }) => tag === 'modified')?.children?.[0]?.text;
    },
  },
  methods: {
    copyToClipboard(): void {
      if (!this.code) return;

      let code = this.modified ?? this.code;
      // ensure there's a final newline
      if (!code.endsWith('\n')) code += '\n';

      navigator.clipboard.writeText(code);
    },
    onPin({ pinned, handle }: { pinned: boolean; handle: number }): void {
      const eventData: PinEvent & Partial<PinCodeSnippet> = { pinned, handle };
      if (pinned) {
        eventData.type = 'code-snippet';
        eventData.language = this.language;
        eventData.location = this.decodedLocation;
        eventData.content = this.code;
      }
      this.$root.$emit('pin', eventData);
    },
    async onApply(resultCallback: (result: 'success' | 'failure') => void): Promise<void> {
      if (this.pendingApply) return;
      if (!this.decodedLocation) return;

      this.$root.$emit('apply', this.decodedLocation, this.code);

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
    this.code = stripFileDirective(this.$slots.default?.[0].text ?? '');
  },
});
</script>

<style lang="scss" scoped>
.code-snippet::v-deep {
  pre {
    margin: 0;
    border: 0;
    border-radius: 0 0 $border-radius $border-radius;
    padding: 0.5rem 1rem 0.25rem 1rem;
    overflow: auto;
  }

  code {
    line-height: 1.6;
  }
}
</style>
