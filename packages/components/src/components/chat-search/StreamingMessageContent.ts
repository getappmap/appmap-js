import Vue from 'vue';
import VCodeFencedContent from '@/components/chat/CodeFencedContent.vue';
import VNextPromptButton from '@/components/chat/NextPromptButton.vue';

function getAttributeRecord(attrs: NamedNodeMap): Record<string, string> {
  return Array.from(attrs).reduce((memo, attr) => {
    memo[attr.name] = attr.value;
    return memo;
  }, {} as Record<string, string>);
}

function buildNode(h: Vue.CreateElement, src: Element, $root: Vue): Vue.VNode | undefined {
  const children = [];
  for (let i = 0; i < src.childNodes.length; i++) {
    const srcChild = src.childNodes[i];
    let vnode;
    if (srcChild instanceof Element) {
      vnode = buildNode(h, srcChild as Element, $root);
    } else if (srcChild instanceof Text) {
      vnode = srcChild.textContent;
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
    // HACK: Attributes are converted to props
    // This isn't a big deal now, but worth keeping in mind as a potential issue
    // in the future.
    return h(tag, { props }, children);
  }
  return h(
    tag,
    {
      class: src.className.length ? src.className : undefined,
      attrs: getAttributeRecord(src.attributes),
      on: {
        click:
          tag === 'a' && src.attributes.getNamedItem('emit-event')
            ? (e: MouseEvent) => {
                const href = src.attributes.getNamedItem('href')?.value;
                if (!href) return;

                e.preventDefault();
                $root.$emit('click-link', href);
              }
            : () => {},
      },
    },
    children
  );
}

/**
 * This component is responsible for dynamically rendering HTML content containing Vue components.
 */
export default Vue.extend({
  name: 'v-streaming-message-content',
  props: {
    content: String,
    active: Boolean,
  },
  components: {
    VCodeFencedContent,
    VNextPromptButton,
  },
  data() {
    return {
      elementIndex: {} as Record<string, Vue.VNode>,
      parser: new DOMParser(),
    };
  },
  render(h): Vue.VNode {
    const dom = this.parser.parseFromString(this.content.trim(), 'text/html');

    const children = [];
    for (let i = 0; i < dom.body.childNodes.length; i++) {
      const vnode = buildNode(h, dom.body.childNodes[i] as Element, this.$root);
      if (vnode) {
        children.push(vnode);
      }
    }

    return h('div', children);
  },
});
