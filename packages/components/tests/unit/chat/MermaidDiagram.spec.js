// it can be downloaded
// the copy button copies the diagram definition
// the expand button expands the diagram

import VMermaidDiagram from '@/components/chat/MermaidDiagram.vue';
import { mount } from '@vue/test-utils';
import * as downloadSvg from '@/lib/downloadSvg';

jest.mock('@/lib/downloadSvg');

describe('components/MermaidDiagram.vue', () => {
  const graphDefinition = 'graph TD\n    A[Birthday] -->|Get money| B(Go shopping)';
  let wrapper;
  let clipboardText;

  beforeEach(() => {
    wrapper = mount(VMermaidDiagram, {
      slots: {
        default: [graphDefinition],
      },
    });
    Object.assign(navigator, {
      clipboard: {
        async writeText(val) {
          clipboardText = val;
          return Promise.resolve();
        },
        async readText() {
          return Promise.resolve(clipboardText);
        },
      },
    });
  });

  it('renders a diagram', () => {
    expect(wrapper.find('[data-cy="mermaid-diagram"] [data-cy="graphic"] svg').exists()).toBe(true);
  });

  it('copies the diagram definition', async () => {
    await wrapper.find('[data-cy="context-menu"]').trigger('click');
    const copyButton = wrapper.find('[data-cy="context-menu-item"]:nth-child(2)');
    expect(copyButton.exists()).toBe(true);

    await copyButton.trigger('click');
    const result = await navigator.clipboard.readText();
    expect(result).toBe(graphDefinition);
  });

  it('expands the diagram', async () => {
    const expandButton = wrapper.find('[data-cy="expand"]');

    expect(wrapper.find('[data-cy="diagram-modal"]').exists()).toBe(false);
    await expandButton.trigger('click');

    expect(wrapper.find('[data-cy="diagram-modal"]').exists()).toBe(true);
    await wrapper.find('[data-cy="expand-close"]').trigger('click');

    expect(wrapper.find('[data-cy="diagram-modal"]').exists()).toBe(false);
  });

  it('downloads the diagram', async () => {
    const downloadSvgMock = jest.spyOn(downloadSvg, 'default').mockResolvedValue();
    await wrapper.find('[data-cy="context-menu"]').trigger('click');

    const downloadButton = wrapper.find('[data-cy="context-menu-item"]:nth-child(3)');
    await downloadButton.trigger('click');

    expect(downloadSvgMock).toHaveBeenCalledWith(
      '<svg></svg>',
      expect.stringMatching(/^diagram-\d+.png$/)
    );
  });

  it('links to the Mermaid live editor', async () => {
    await wrapper.find('[data-cy="context-menu"]').trigger('click');
    const externalLink = wrapper.find('[data-cy="context-menu-items"] a');
    expect(externalLink.attributes('href')).toEqual(
      'https://mermaid.live/edit#pako:eNqrVkrOT0lVslJKL0osyFAIcYnJUwACx2inzKKSjJTEylgFXV27GvfUEoXc_LzUyhoFJw33fIXijPyCgsy8dE0lHaXc1KLcxMwUJavq2loA-EEaJA'
    );
  });
});
