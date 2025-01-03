import { setConfiguration, DefaultApiURL } from '@appland/client';

export default {
  props: {
    apiKey: {
      type: String,
      required: false,
    },
    apiUrl: {
      type: String,
      required: false,
    },
  },
  watch: {
    apiKey: {
      handler() {
        this.updateClientConfiguration();
      },
      immediate: true,
    },
    apiUrl: {
      handler() {
        this.updateClientConfiguration();
      },
      immediate: true,
    },
  },
  computed: {
    email() {
      if (!this.apiKey) return;
      try {
        const decodedKey = atob(this.apiKey);
        const [email] = decodedKey.split(':');
        return email;
      } catch (e) {
        console.error('Failed to decode apiKey', e);
        return;
      }
    },
  },
  methods: {
    updateClientConfiguration() {
      setConfiguration({ apiKey: this.apiKey, apiURL: this.apiUrl || DefaultApiURL });
    },
  },
};
