import VAutoComplete from '@/components/chat/AutoComplete.vue';
import { mount } from '@vue/test-utils';

describe('AutoComplete', () => {
  let caretPosition = undefined;
  const commands = [
    {
      command: '@one',
      label: 'First description',
    },
    {
      command: '@two',
      label: 'Second description.',
    },
    {
      command: '@three',
      label: 'Third description.',
    },
  ];

  beforeEach(() => {
    document.getSelection = jest.fn().mockImplementation(() => ({ focusOffset: caretPosition }));
  });

  afterEach(() => {
    caretPosition = undefined;
    jest.resetAllMocks();
  });

  it('only shows if the input caret is on a completable command', async () => {
    const input = '@ hello world';
    caretPosition = input.length;
    const wrapper = mount(VAutoComplete, { propsData: { input, commands } });
    expect(wrapper.find('[data-cy="autocomplete"]').exists()).toBe(false);

    caretPosition = 1;
    document.dispatchEvent(new Event('selectionchange'));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-cy="autocomplete"]').exists()).toBe(true);
  });

  it('only appears in valid cases', async () => {
    const input = '@thre hello world';
    const wrapper = mount(VAutoComplete, { propsData: { input, commands } });
    expect(wrapper.find('[data-cy="autocomplete"]').exists()).toBe(false);

    for (let i = 0; i < input.length; i++) {
      caretPosition = i;
      document.dispatchEvent(new Event('selectionchange'));
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-cy="autocomplete"]').exists()).toBe(i > 0 && i <= 5);
    }
  });

  it('does not autocomplete in the middle of an input', async () => {
    const input = 'hello world @';
    const wrapper = mount(VAutoComplete, { propsData: { input, commands } });
    expect(wrapper.find('[data-cy="autocomplete"]').exists()).toBe(false);

    caretPosition = input.length;
    document.dispatchEvent(new Event('selectionchange'));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-cy="autocomplete"]').exists()).toBe(false);
  });

  it('considers the full token as completable text', async () => {
    const input = '@three hello world';
    const wrapper = mount(VAutoComplete, { propsData: { input, commands } });
    expect(wrapper.find('[data-cy="autocomplete"]').exists()).toBe(false);

    caretPosition = 1;
    document.dispatchEvent(new Event('selectionchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-cy="autocomplete"]').exists()).toBe(false);
  });

  describe('when visible', () => {
    let wrapper;

    beforeEach(async () => {
      caretPosition = 1;
      wrapper = mount(VAutoComplete, { propsData: { input: '', commands } });
      await wrapper.setProps({ input: '@' });
      expect(wrapper.find('[data-cy="autocomplete"]').isVisible()).toBe(true);
    });

    it('navigates commands with arrow keys', async () => {
      expect(wrapper.find('[data-active]').text()).toBe('@one');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-active]').text()).toBe('@two');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-active]').text()).toBe('@three');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-active]').text()).toBe('@two');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-active]').text()).toBe('@one');
    });

    it('navigates with mouse over', async () => {
      expect(wrapper.find('[data-active]').text()).toBe('@one');

      await wrapper.find('[data-cy="autocomplete"] li:nth-child(2)').trigger('mouseover');
      expect(wrapper.find('[data-active]').text()).toBe('@two');
    });

    it('emits an event upon tab or enter', async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('submit')).toStrictEqual([['@one']]);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('submit')).toStrictEqual([['@one']]);
    });
  });
});
