import VAccordion from '@/components/Accordion.vue';

export default {
  title: 'AppLand/UI/Accordion',
  component: VAccordion,
  argTypes: {},
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VAccordion },
  template: `
    <v-accordion>
      <template v-slot:header>
        This is the header
      </template>
        This is the body
    </v-accordion>
  `,
});

export const accordion = Template.bind({});
