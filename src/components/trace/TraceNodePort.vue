<template>
  <div class="port">
    <component :is="portType" class="icon" v-if="type === 'input'" />
    <span class="label">{{ text }}</span>
    <component :is="portType" class="icon" v-if="type === 'output'" />
  </div>
</template>

<script>
import PortConnected from '@/assets/port_connected.svg';
import PortDisconnected from '@/assets/port_disconnected.svg';

export default {
  name: 'v-trace-node-port',
  components: {
    PortConnected,
    PortDisconnected,
  },
  props: {
    type: {
      type: String,
      default: 'input',
      validator: (value) => ['input', 'output'].indexOf(value) !== -1,
    },
    text: {
      type: String,
      required: true,
    },
    value: {
      required: false,
    },
  },
  computed: {
    portType() {
      return this.value ? 'port-connected' : 'port-disconnected';
    },
  },
};
</script>

<style scoped lang="scss">
.port {
  display: block;
  cursor: pointer;
  transition: color 0.3s cubic-bezier(0.25, 0.5, 0.25, 1);

  &:hover {
    color: $white;
  }
}

.label {
  line-height: 1em;
}

.icon {
  height: 0.8rem;
  fill: red;
  vertical-align: middle;
}
</style>
