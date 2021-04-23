import VNotification from '@/components/Notification.vue';
import patchNotes from './data/patch_notes_html';

export default {
  title: 'AppLand/UI/Notification',
  component: VNotification,
  args: {
    version: 'v1.1.0',
    body: patchNotes,
  },
};

export const notification = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VNotification },
  template: '<v-notification v-bind="$props"/>',
});
