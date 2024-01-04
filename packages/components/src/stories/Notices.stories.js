import VNoDataNotice from '@/components/notices/NoDataNotice.vue';
import VUnlicensedNotice from '@/components/notices/UnlicensedNotice.vue';

export default {
  title: 'AppLand/Notices',
  argTypes: {},
};

export const NoData = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VNoDataNotice },
  template: `<v-no-data-notice v-bind="$props" />`,
});

export const Unlicensed = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VUnlicensedNotice },
  template: `<v-unlicensed-notice v-bind="$props" />`,
});
Unlicensed.args = {
  purchaseUrl: 'https://appmap.io/pricing',
};
