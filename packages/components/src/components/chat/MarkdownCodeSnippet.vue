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
import Vue, { PropType } from 'vue';

import hljs from 'highlight.js';
import stripCodeFences from '@/lib/stripCodeFences';
import { URI } from '@appland/rpc';

hljs.registerAliases(['rake', 'Gemfile'], { languageName: 'ruby' });
hljs.registerAliases(['vue'], { languageName: 'xml' });

interface Injected {
  rpcClient: AppMapRPC;
  projectDirectories: string[];
}

export default Vue.extend({
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
      code: stripCodeFences(this.$slots.default?.[0].text ?? ''),
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
      if (this.location) {
        // TODO: is location still in use? Ideally everything is a URI now.
        try {
          return decodeURIComponent(this.location);
        } catch (e) {
          console.error('Invalid location:', this.location, e);
        }
      }

      if (this.uri) {
        try {
          const uri = URI.parse(this.uri);
          return uri.fsPath;
        } catch (e) {
          console.error('Invalid URI:', this.uri, e);
        }
      }

      return undefined;
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
    onPin({ pinned, uri }: { pinned: boolean; uri: string }): void {
      this.$root.$emit('pin', { pinned, uri });
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
    this.code = stripCodeFences(this.$slots.default?.[0].text ?? '');
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
