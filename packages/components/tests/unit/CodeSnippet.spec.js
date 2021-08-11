import { mount } from '@vue/test-utils';
import CodeSnippet from '@/components/CodeSnippet.vue';

describe('CodeSnippet.vue', () => {
  Object.assign(navigator, {
    clipboard: {
      async writeText(val) {
        this.clipboardText = val;
        return Promise.resolve();
      },
      async readText() {
        return Promise.resolve(this.clipboardText);
      },
    },
  });

  it('copies text when clicked', async () => {
    const clipboardText = 'This text will be copied to the clipboard';
    const wrapper = mount(CodeSnippet, {
      propsData: { clipboardText },
      mocks: { navigator },
    });

    wrapper.get('pre').trigger('click');

    const actualClipboardText = await navigator.clipboard.readText();
    expect(actualClipboardText).toBe(clipboardText);
  });
});
