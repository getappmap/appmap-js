import Vue from 'vue';
import VCodeFencedContent from '@/components/chat/CodeFencedContent.vue';
import VNextPromptButton from '@/components/chat/NextPromptButton.vue';

function findCursorNode(node: Node): Node | undefined {
  const children = Array.from(node.childNodes);
  while (children.length) {
    const child = children.pop() as Node;
    const textNode = findCursorNode(child);
    if (textNode) return textNode;
  }

  if (node.textContent && node.textContent.trim() !== '') return node;
}

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
    return h(
      tag,
      { props },
      children.map((c) => {
        // HACK: Cursor is a special case given the way we're rendering code snippets.
        // We write the source code directly into a slot to avoid the need to escape or
        // encode the source text as a prop when rendering markdown. Thus, the cursor is
        // rendered into it's own special slot.
        const isCursor = typeof c === 'object' && c.data && c.data.class === 'cursor';
        return isCursor ? h('span', { slot: 'cursor', class: 'cursor' }) : c;
      })
    );
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

    if (this.active) {
      const textNode = findCursorNode(dom.body);
      const cursor = dom.createElement('span');
      cursor.classList.add('cursor');
      const targetElement = textNode?.parentElement ?? dom.body;
      targetElement.appendChild(cursor);
    }

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
