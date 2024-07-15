import Vue from 'vue';
import VMarkdownCodeSnippet from '@/components/chat/MarkdownCodeSnippet.vue';
import VMermaidDiagram from '@/components/chat/MermaidDiagram.vue';

function createElement(
  h: Vue.CreateElement,
  node: Node,
  indexPath: number[],
  index: Record<string, Vue.VNode>
): Vue.VNode | undefined {
  if (!(node instanceof Element)) return;
  console.log(indexPath.join('.'), node);

  const element = h(
    node.tagName.toLowerCase(),
    {
      // attrs: node.attributes,
    },
    [...node.childNodes, node.textContent]
      .map((child, i) => {
        if (!child) return;
        if (typeof child === 'string') return child;
        return createElement(h, child, [...indexPath, i], index);
      })
      .filter(Boolean)
  );
  index[indexPath.join('.')] = element;

  return element;
}

function findLastTextNode(node: Node): Node | undefined {
  const children = Array.from(node.childNodes);
  while (children.length) {
    const child = children.pop() as Node;
    const textNode = findLastTextNode(child);
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

function syncNode(h: Vue.CreateElement, src: Element, dst?: Vue.VNode): Vue.VNode | undefined {
  const children = [];
  for (let i = 0; i < src.childNodes.length; i++) {
    const srcChild = src.childNodes[i];
    let vnode;
    if (srcChild instanceof Element) {
      vnode = syncNode(h, srcChild as Element, dst?.children?.[i]);
    } else if (srcChild instanceof Text) {
      vnode = srcChild.textContent;
    }

    if (vnode) children.push(vnode);
  }

  if (!src.tagName) {
    return;
  }

  if (!dst) {
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
      },
      children
    );
    return;
  }

  return dst;
}

export default Vue.extend({
  name: 'v-streaming-message-content',
  props: {
    content: String,
    active: Boolean,
  },
  components: {
    VMarkdownCodeSnippet,
    VMermaidDiagram,
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
      const textNode = findLastTextNode(dom.body);
      if (textNode) {
        const cursor = dom.createElement('span');
        cursor.classList.add('cursor');
        textNode.parentElement?.appendChild(cursor);
      }
    }

    const children = [];
    for (let i = 0; i < dom.body.childNodes.length; i++) {
      children.push(syncNode(h, dom.body.childNodes[i] as Element, this.$vnode.children?.[i]));
    }
    return h('div', children);
  },
  methods: {
    updateElements(h: Vue.CreateElement): void {
      const dom = this.parser.parseFromString(this.content, 'text/html');
      Array.from(dom.body.children).forEach((child, i) => {
        return createElement(h, child, [i], this.elementIndex);
      });
    },
  },
});
