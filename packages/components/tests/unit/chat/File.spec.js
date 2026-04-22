import VFile from '@/components/chat/File.vue';
import { URI } from '@appland/rpc';
import { mount } from '@vue/test-utils';
import eventBus from '@/lib/eventBus';

describe('components/chat/File.vue', () => {
  it('can open a file', async () => {
    const uri = URI.file('/home/user/my-project/app/models/user.rb');
    const wrapper = mount(VFile, {
      props: {
        uri: uri.toString(),
      },
    });
    const spy = jest.fn();
    eventBus.on('open-location', spy);

    await wrapper.find('[data-cy="open"]').trigger('click');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(uri.fsPath);
    eventBus.off('open-location', spy);
  });
});
