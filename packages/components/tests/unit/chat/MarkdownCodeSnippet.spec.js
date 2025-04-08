// it can be downloaded
// the copy button copies the diagram definition
// the expand button expands the diagram

import VMarkdownCodeSnippet from '@/components/chat/MarkdownCodeSnippet.vue';
import { mount, createWrapper } from '@vue/test-utils';

describe('components/MarkdownCodeSnippet.vue', () => {
  const code = 'console.log("Hello world!");';

  it('can copy the code snippet', async () => {
    let clipboardText;

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

    const wrapper = mount(VMarkdownCodeSnippet, {
      propsData: {
        language: 'javascript',
      },
      slots: {
        default: [code],
      },
    });

    expect(clipboardText).toBeUndefined();
    await wrapper.find('[data-cy="copy"]').trigger('click');
    expect(clipboardText).toBe(code + '\n');
  });

  it('can apply a code change', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const location = '/home/user/my-project/app/models/user.rb';
    const wrapper = mount(VMarkdownCodeSnippet, {
      propsData: {
        language: 'javascript',
        location,
      },
      slots: {
        default: [code],
      },
      provide: {
        rpcClient: { update },
      },
    });

    await wrapper.find('[data-cy="apply"]').trigger('click');
    expect(update).toHaveBeenCalledWith(location, code, undefined);
  });

  it('can open a file', async () => {
    const directory = '/home/user/my-project';
    const location = 'app/models/user.rb';
    const wrapper = mount(VMarkdownCodeSnippet, {
      propsData: {
        language: 'javascript',
        location,
        directory,
      },
      slots: {
        default: [code],
      },
    });
    const rootWrapper = createWrapper(wrapper.vm.$root);

    await wrapper.find('[data-cy="open"]').trigger('click');
    expect(rootWrapper.emitted()['open-location']).toEqual([[location, directory]]);
  });

  it('displays relative file names', async () => {
    const wrapper = mount(VMarkdownCodeSnippet, {
      propsData: {
        language: 'javascript',
        location: '/home/user/my-project/app/models/user.rb',
      },
      slots: {
        default: [code],
      },
      provide: { projectDirectories: ['/home/user/my-project'] },
    });

    expect(wrapper.find('[data-cy="context-title"]').text()).toContain('app/models/user.rb');
  });

  it('does not leak URIs', () => {
    const wrapper = mount(VMarkdownCodeSnippet, {
      propsData: {
        language: 'javascript',
        uri: 'urn:uuid:12345678-1234-5678-1234-123456789012',
      },
    });

    expect(wrapper.find('[data-cy="context-title"]').text()).toContain('javascript');
  });
});
