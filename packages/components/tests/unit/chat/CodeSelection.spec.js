import VCodeSelection from '@/components/chat/CodeSelection.vue';
import { mount } from '@vue/test-utils';
import { URI } from '@appland/rpc';

describe('components/chat/CodeSelection.vue', () => {
  const content = 'class UsersController < ApplicationController';

  it('renders defaults', async () => {
    const wrapper = mount(VCodeSelection, { propsData: { content } });
    expect(wrapper.text()).toContain('Code snippet');

    await wrapper.find('[data-cy="code-selection-header"]').trigger('click');
    expect(wrapper.find('[data-cy="code-selection-content"]').isVisible()).toBe(true);
  });

  it('renders content', () => {
    const wrapper = mount(VCodeSelection, { propsData: { content } });

    wrapper.find('[data-cy="code-selection-header"]').trigger('click');

    expect(wrapper.text()).toContain(content);
  });

  it('reveals code on click', async () => {
    const wrapper = mount(VCodeSelection, { propsData: { content } });
    const header = wrapper.find('[data-cy="code-selection-header"]');

    expect(wrapper.find('[data-cy="code-selection-content"]').isVisible()).toBe(false);
    header.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-cy="code-selection-content"]').isVisible()).toBe(true);

    header.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-cy="code-selection-content"]').isVisible()).toBe(false);
  });

  it('properly formats unix paths', () => {
    const wrapper = mount(VCodeSelection, {
      propsData: { content, uri: URI.file('/app/controllers/users_controller.rb').toString() },
    });

    expect(wrapper.find('[data-cy="title"]').text()).toBe('users_controller.rb');
  });

  it('properly formats Windows paths', () => {
    const wrapper = mount(VCodeSelection, {
      propsData: { content, uri: URI.file('C:\\app\\controllers\\users_controller.rb').toString() },
    });

    expect(wrapper.find('[data-cy="title"]').text()).toBe('users_controller.rb');
  });

  it('properly formats paths with no separator', () => {
    const wrapper = mount(VCodeSelection, {
      propsData: { content, uri: URI.file('users_controller.rb').toString() },
    });

    expect(wrapper.find('[data-cy="title"]').text()).toBe('users_controller.rb');
  });

  it('renders line numbers', () => {
    const wrapper = mount(VCodeSelection, {
      propsData: { content, uri: URI.file('users_controller.rb', { start: 1, end: 3 }).toString() },
    });

    expect(wrapper.find('[data-cy="title"]').text()).toBe('users_controller.rb:1-3');
  });

  it('renders a single line number', () => {
    const wrapper = mount(VCodeSelection, {
      propsData: { content, uri: URI.file('users_controller.rb', { start: 1 }).toString() },
    });

    expect(wrapper.find('[data-cy="title"]').text()).toBe('users_controller.rb:1');
  });

  it('does not render line numbers without a starting line', () => {
    const wrapper = mount(VCodeSelection, {
      propsData: { content, uri: URI.file('users_controller.rb', { end: 1 }).toString() },
    });

    expect(wrapper.find('[data-cy="title"]').text()).toBe('users_controller.rb');
  });

  it('uses the file extension for syntax highlighting if no language is provided', () => {
    const wrapper = mount(VCodeSelection, {
      propsData: { content, uri: URI.file('users_controller.rb').toString() },
    });
    expect(wrapper.find('.hljs-keyword').exists()).toBe(true);
  });

  it('does not raise an error if the language is unknown', () => {
    const wrapper = mount(VCodeSelection, { propsData: { content, language: '????' } });
    expect(wrapper.find('.hljs-keyword').exists()).toBe(false);
  });

  it('uses the provided language for syntax highlighting', () => {
    const wrapper = mount(VCodeSelection, { propsData: { content, language: 'ruby' } });
    expect(wrapper.find('.hljs-keyword').exists()).toBe(true);
  });

  it('does not perform syntax highlighting if the language is not recognized', () => {
    const wrapper = mount(VCodeSelection, { propsData: { content } });
    expect(wrapper.find('.hljs-keyword').exists()).toBe(false);
  });
});
