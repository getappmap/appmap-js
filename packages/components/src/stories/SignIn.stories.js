import VSignIn from '@/components/SignIn.vue';

export default {
  title: 'Pages/VS Code/Sign In',
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

// The response the activation API returns when the email domain is licensed
// through a managed installation instead of individual accounts. Both
// /api/activations and /api/activations/verify answer 403 with this body.
const DENIAL_STATUS = 403;
const DENIAL_BODY = {
  error: {
    code: 'sign_in_denied',
    message:
      'Sign-in is disabled for this email domain. Your organization licenses AppMap through a ' +
      'managed installation; please contact your IT department for access.',
  },
};

// Simulates the activation API by stubbing fetch for its two endpoints, so the
// denial path can be exercised without a server. `routes` maps a path fragment
// to the [status, body] the stub answers with.
const StubbedApiTemplate =
  (routes) =>
  (args, { argTypes }) => ({
    props: Object.keys(argTypes),
    components: { VSignIn },
    template: '<v-sign-in v-bind="$props" ref="vsCode" />',
    created() {
      this.originalFetch = window.fetch;
      window.fetch = (input, init) => {
        const url = String(input && input.url ? input.url : input);
        // Longest match first, so /api/activations/verify wins over /api/activations.
        const path = Object.keys(routes)
          .sort((a, b) => b.length - a.length)
          .find((fragment) => url.includes(fragment));
        if (!path) return this.originalFetch(input, init);

        const [status, body] = routes[path];
        return Promise.resolve(
          new Response(body === undefined ? null : JSON.stringify(body), {
            status,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      };
    },
    beforeDestroy() {
      if (this.originalFetch) window.fetch = this.originalFetch;
    },
  });

// Enter any email and activate: the server denies the domain.
export const SignInDenied = StubbedApiTemplate({
  '/api/activations': [DENIAL_STATUS, DENIAL_BODY],
}).bind({});

// The email is accepted, but the domain is denied when the code is verified.
export const SignInDeniedAtVerification = StubbedApiTemplate({
  '/api/activations': [201, undefined],
  '/api/activations/verify': [DENIAL_STATUS, DENIAL_BODY],
}).bind({});
