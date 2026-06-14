import VSignIn from '@/components/SignIn.vue';

export default {
  title: 'Pages/VS Code',
  component: VSignIn,
  parameters: {
    chromatic: {
      delay: 1000,
      diffThreshold: 1,
    },
  },
  argTypes: {},
  args: {},
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VSignIn },
  template: '<v-sign-in v-bind="$props" ref="vsCode" />',
});

export const SignIn = Template.bind({});

// Simulates a host that handles the apply-org-config event, so e2e tests can
// exercise the full click → event → confirmation round trip.
const OrgConfigTemplate = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VSignIn },
  template: '<v-sign-in v-bind="$props" ref="vsCode" />',
  mounted() {
    this.applyOrgConfigHandler = () => {
      if (this.$refs.vsCode) {
        this.$refs.vsCode.onOrgConfigApplied();
      }
    };
    this.$root.$on('apply-org-config', this.applyOrgConfigHandler);
  },
  beforeDestroy() {
    if (this.applyOrgConfigHandler) {
      this.$root.$off('apply-org-config', this.applyOrgConfigHandler);
    }
  },
});

export const SignInWithOrgConfig = OrgConfigTemplate.bind({});
SignInWithOrgConfig.args = {
  enableOrgConfig: true,
};

export const SignInWithOrgConfigAlreadyApplied = OrgConfigTemplate.bind({});
SignInWithOrgConfigAlreadyApplied.args = {
  enableOrgConfig: true,
  orgConfigApplied: true,
};
