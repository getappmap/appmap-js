import VSuggestionGrid from '@/components/chat/SuggestionGrid.vue';
import { mount } from '@vue/test-utils';

describe('SuggestionGrid.vue', () => {
  it('emits a `suggest` event upon selecting an option', () => {
    const prompt = 'Example prompt';
    const wrapper = mount(VSuggestionGrid, {
      propsData: {
        suggestions: [
          {
            title: 'Example title',
            subTitle: 'Example subtitle',
            prompt,
          },
        ],
      },
    });

    wrapper.get('[data-cy="prompt-suggestion"]').trigger('click');

    const event = wrapper.emitted('suggest');
    expect(event).toBeTruthy();
    expect(event[0][0]).toEqual(prompt);
  });

  it('displays all prompts', () => {
    const suggestions = [];
    const numPrompts = 10;
    for (let i = 0; i < numPrompts; i++) {
      suggestions.push({
        title: `Example title ${i}`,
        subTitle: `Example subtitle ${i}`,
        prompt: `Example prompt ${i}`,
      });
    }
    const wrapper = mount(VSuggestionGrid, {
      propsData: {
        suggestions,
      },
    });

    const prompts = wrapper.findAll('[data-cy="prompt-suggestion"]');
    expect(prompts).toHaveLength(numPrompts);
    suggestions.forEach((suggestion, i) => {
      const prompt = prompts.wrappers[i];
      expect(prompt.text()).toContain(suggestion.title);
      expect(prompt.text()).toContain(suggestion.subTitle);
    });
  });
});
