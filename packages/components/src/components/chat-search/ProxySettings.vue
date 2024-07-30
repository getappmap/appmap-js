<template>
  <div>
    <h2>Proxy Settings</h2>

    <p v-if="hasHttpProxy">HTTP Proxy is set</p>
    <p v-if="hasHttpsProxy">HTTPS Proxy is set</p>
    <p v-else>No HTTP/HTTPS Proxy Settings found</p>
  </div>
</template>
<script>
export default {
  name: 'ProxySettings',
  props: {
    proxySettings: {
      type: Object,
    },
  },
  computed: {
    hasHttpProxy() {
      return !!this.proxySettings.http_proxy;
    },
    hasHttpsProxy() {
      return !!this.proxySettings.https_proxy;
    },
  },
};
</script>
