import { defineComponent, h, type VNode } from 'vue';
import VCodeFencedContent from '@/components/chat/CodeFencedContent.vue';
import VNextPromptButton from '@/components/chat/NextPromptButton.vue';
import VInlineRecommendation from '@/components/chat/InlineRecommendation.vue';
import VMarkdownCodeSnippet from '@/components/chat/MarkdownCodeSnippet.vue';
import eventBus from '@/lib/eventBus';

function getAttributeRecord(attrs: NamedNodeMap): Record<string, string> {
  return Array.from(attrs).reduce((memo, attr) => {
    memo[attr.name] = attr.value;
    return memo;
  }, {} as Record<string, string>);
}

function buildNode(src: Element): VNode | string | undefined {
  const children: (VNode | string)[] = [];
  for (let i = 0; i < src.childNodes.length; i++) {
    const srcChild = src.childNodes[i];
    let vnode: VNode | string | undefined;
    if (srcChild instanceof Element) {
      vnode = buildNode(srcChild as Element);
    } else if (srcChild instanceof Text) {
      vnode = srcChild.textContent ?? undefined;
    }

    if (vnode) children.push(vnode);
  }

  if (!src.tagName) {
    return;
  }

  const tag = src.tagName.toLowerCase();
  // HACK: Is there a better way to identify custom components?
  if (tag.startsWith('v-')) {
    const props = Object.values(src.attributes).reduce((memo, attr) => {
      if (attr.name === 'class') return memo;
      memo[attr.name] = attr.value;
      return memo;
    }, {} as Record<string, string>);
    // HACK: Attributes are converted to props (flat in Vue 3)
    return h(tag, props, children);
  }

  const clickHandler =
    tag === 'a' && src.attributes.getNamedItem('emit-event')
      ? (e: MouseEvent) => {
          const href = src.attributes.getNamedItem('href')?.value;
          if (!href) return;
          e.preventDefault();
          eventBus.emit('click-link', href);
        }
      : undefined;

  return h(
    tag,
    {
      class: src.className.length ? src.className : undefined,
      ...getAttributeRecord(src.attributes),
      ...(clickHandler ? { onClick: clickHandler } : {}),
    },
    children
  );
}

/**
 * This component is responsible for dynamically rendering HTML content containing Vue components.
 */
export default defineComponent({
  name: 'v-streaming-message-content',
  props: {
    content: String,
    active: Boolean,
  },
  components: {
    VCodeFencedContent,
    VNextPromptButton,
    VInlineRecommendation,
    VMarkdownCodeSnippet,
  },
  data() {
    return {
      parser: new DOMParser(),
    };
  },
  render(): VNode {
    const dom = this.parser.parseFromString(this.content!.trim(), 'text/html');

    const children: (VNode | string)[] = [];
    for (let i = 0; i < dom.body.childNodes.length; i++) {
      const vnode = buildNode(dom.body.childNodes[i] as Element);
      if (vnode) {
        children.push(vnode);
      }
    }

    return h('div', children);
  },
});
