import VCodeSelection from '@/components/chat/CodeSelection.vue';
import { mount } from '@vue/test-utils';

describe('components/chat/CodeSelection.vue', () => {
  const code = 'class UsersController < ApplicationController';

  it('renders defaults', async () => {
    const wrapper = mount(VCodeSelection, { propsData: { code } });
    expect(wrapper.text()).toContain('Code snippet');
    expect(wrapper.text()).toContain('Click to expand');

    wrapper.find('[data-cy="tool-status"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Click to hide');
  });

  it('renders code', () => {
    const wrapper = mount(VCodeSelection, { propsData: { code } });

    wrapper.find('[data-cy="code-selection"]').trigger('click');

    expect(wrapper.text()).toContain(code);
  });

  it('reveals code on click', async () => {
    const wrapper = mount(VCodeSelection, { propsData: { code } });
    const toolStatus = wrapper.find('[data-cy="tool-status"]');

    expect(wrapper.find('[data-cy="code-selection-content"]').isVisible()).toBe(false);
    toolStatus.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-cy="code-selection-content"]').isVisible()).toBe(true);

    toolStatus.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-cy="code-selection-content"]').isVisible()).toBe(false);
  });

  it('properly formats unix paths', () => {
    const wrapper = mount(VCodeSelection, {
      propsData: { code, path: '/app/controllers/users_controller.rb' },
    });

    expect(wrapper.find('[data-cy="title"]').text()).toBe('users_controller.rb');
  });

  it('properly formats Windows paths', () => {
    const wrapper = mount(VCodeSelection, {
      propsData: { code, path: 'C:\\app\\controllers\\users_controller.rb' },
    });

    expect(wrapper.find('[data-cy="title"]').text()).toBe('users_controller.rb');
  });

  it('properly formats paths with no separator', () => {
    const wrapper = mount(VCodeSelection, { propsData: { code, path: 'users_controller.rb' } });

    expect(wrapper.find('[data-cy="title"]').text()).toBe('users_controller.rb');
  });

  it('renders line numbers', () => {
    const wrapper = mount(VCodeSelection, {
      propsData: { code, path: 'users_controller.rb', lineStart: 1, lineEnd: 3 },
    });

    expect(wrapper.find('[data-cy="title"]').text()).toBe('users_controller.rb:1-3');
  });

  it('renders a single line number', () => {
    const wrapper = mount(VCodeSelection, {
      propsData: { code, path: 'users_controller.rb', lineStart: 1 },
    });

    expect(wrapper.find('[data-cy="title"]').text()).toBe('users_controller.rb:1');
  });

  it('does not render line numbers without a starting line', () => {
    const wrapper = mount(VCodeSelection, {
      propsData: { code, path: 'users_controller.rb', lineEnd: 1 },
    });

    expect(wrapper.find('[data-cy="title"]').text()).toBe('users_controller.rb');
  });

  it('renders a default title when no path is provided, but a line is', () => {
    const wrapper = mount(VCodeSelection, { propsData: { code, lineStart: 1, lineEnd: 3 } });
    expect(wrapper.find('[data-cy="title"]').text()).toBe('Code snippet');
  });

  it('uses the file extension for syntax highlighting if no language is provided', () => {
    const wrapper = mount(VCodeSelection, { propsData: { code, path: 'users_controller.rb' } });
    expect(wrapper.find('.hljs-keyword').exists()).toBe(true);
  });

  it('does not raise an error if the language is unknown', () => {
    const wrapper = mount(VCodeSelection, { propsData: { code, language: '????' } });
    expect(wrapper.find('.hljs-keyword').exists()).toBe(false);
  });

  it('uses the provided language for syntax highlighting', () => {
    const wrapper = mount(VCodeSelection, { propsData: { code, language: 'ruby' } });
    expect(wrapper.find('.hljs-keyword').exists()).toBe(true);
  });

  it('does not perform syntax highlighting if the language is not recognized', () => {
    const wrapper = mount(VCodeSelection, { propsData: { code } });
    expect(wrapper.find('.hljs-keyword').exists()).toBe(false);
  });
});
