import VFile from '@/components/chat/File.vue';
import { URI } from '@appland/rpc';
import { createWrapper, mount } from '@vue/test-utils';

describe('components/chat/File.vue', () => {
  it('can open a file', async () => {
    const uri = URI.file('/home/user/my-project/app/models/user.rb');
    const wrapper = mount(VFile, {
      propsData: {
        uri: uri.toString(),
      },
    });
    const rootWrapper = createWrapper(wrapper.vm.$root);

    await wrapper.find('[data-cy="open"]').trigger('click');
    const actual = rootWrapper.emitted()['open-location'];
    expect(actual).toHaveLength(1);
    expect(actual[0][0]).toStrictEqual(uri.fsPath);
  });
});
