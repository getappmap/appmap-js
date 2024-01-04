import VUnlicensedNotice from '@/components/notices/UnlicensedNotice.vue';
import { createWrapper, mount } from '@vue/test-utils';

describe('UnlicensedNotice.vue', () => {
  it('does not render a purchase button if the purchase URL is not provided', () => {
    const wrapper = mount(VUnlicensedNotice);
    expect(wrapper.find('[data-cy="purchase"]').exists()).toBe(false);
  });
});
