// it can be downloaded
// the copy button copies the diagram definition
// the expand button expands the diagram

import VMermaidDiagram from '@/components/chat/MermaidDiagram.vue';
import { mount } from '@vue/test-utils';
import * as downloadSvg from '@/lib/downloadSvg';
import exp from 'constants';

jest.mock('@/lib/downloadSvg');

describe('components/MermaidDiagram.vue', () => {
  const graphDefinition = 'graph TD\n    A[Birthday] -->|Get money| B(Go shopping)\n';
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
    const copyButton = wrapper.find('[data-cy="copy"]');
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
    const downloadButton = wrapper.find('[data-cy="download"]');
    await downloadButton.trigger('click');

    expect(downloadSvgMock).toHaveBeenCalledWith(
      '<svg></svg>',
      expect.stringMatching(/^diagram-\d+.png$/)
    );
  });

  it('links to the Mermaid live editor', async () => {
    const externalLink = wrapper.find('a[data-cy="open-external"]');
    expect(externalLink.attributes('href')).toEqual(
      'https://mermaid.live/edit#pako:eNqrVkrOT0lVslJKL0osyFAIcYnJUwACx2inzKKSjJTEylgFXV27GvfUEoXc_LzUyhoFJw33fIXijPyCgsy8dM2YPCUdpdzUotzEzBQlq-raWgAvVBru'
    );
  });
});
