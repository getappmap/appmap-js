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
  },
  methods: {
    updateClientConfiguration() {
      setConfiguration({ apiKey: this.apiKey, apiURL: this.apiUrl || DefaultApiURL });
    },
  },
};
