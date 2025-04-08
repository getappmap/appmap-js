import VModelSelector from '@/components/chat-search/ModelSelector.vue';
import { mount } from '@vue/test-utils';

describe('ModelSelector.vue', () => {
  let wrapper;
  const models = [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', createdAt: '2023-03-14' },
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', createdAt: '2023-03-14' },
    { id: 'deekseek-r1:8b', name: 'deepseek-r1:8b', provider: 'Ollama', createdAt: '2025-01-20' },
  ];
  beforeEach(() => {
    wrapper = mount(VModelSelector, {
      propsData: {
        models,
        selectedModel: models[0],
      },
    });
  });

  it('lists available models', async () => {
    // Click to view models
    await wrapper.find('[data-cy="model-selector"]').trigger('click');
    expect(wrapper.findAll('[data-cy="model-selector-item"]').length).toBe(models.length);
  });

  it('emits an event when a model is selected', async () => {
    // Click to view models
    await wrapper.find('[data-cy="model-selector"]').trigger('click');

    // Models are sorted by provider, then by createdAt
    wrapper.find('[data-cy="model-selector-item"]:nth-child(1)').trigger('click');
    expect(wrapper.emitted().select).toStrictEqual([['Ollama', 'deekseek-r1:8b']]);
  });

  it('displays the selected model', () => {
    expect(wrapper.find('[data-cy="selected-model"]').text()).toMatch(
      /GPT-3\.5 Turbo\s+via OpenAI/
    );
  });

  it('highlights the selected model in the list', async () => {
    // Click to view models
    await wrapper.find('[data-cy="model-selector"]').trigger('click');

    const selectedModel = wrapper.find('.model-selector-list__item--selected');
    expect(selectedModel.text()).toMatch(/GPT-3\.5 Turbo\s+OpenAI/);
  });
});
