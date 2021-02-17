<template>
  <v-popper :placement="popperPlacement" :text="popperText">
    <div class="port">
      <component :is="portType" :class="iconClass" v-if="type === 'input'" />
      <span class="label">{{ label }}</span>
      <component :is="portType" :class="iconClass" v-if="type === 'output'" />
    </div>
  </v-popper>
</template>

<script>
import PortConnected from '@/assets/port_connected.svg';
import PortDisconnected from '@/assets/port_disconnected.svg';
import VPopper from '@/components/Popper.vue';

export default {
  name: 'v-trace-node-port',
  components: {
    PortConnected,
    PortDisconnected,
    VPopper,
  },
  props: {
    type: {
      type: String,
      default: 'input',
      validator: (value) => ['input', 'output'].indexOf(value) !== -1,
    },
    text: {
      type: String,
    },
    parameterObject: {
      required: false,
    },
  },
  data() {
    return {
      label: this.text || this.parameterObject.name,
    };
  },
  computed: {
    popperText() {
      if (
        !this.parameterObject ||
        this.parameterObject.value === null ||
        typeof this.parameterObject.value === 'undefined'
      ) {
        return 'null';
      }

      return this.parameterObject.value.toString();
    },
    iconClass() {
      return `icon icon--type-${this.dataType}`;
    },
    dataType() {
      switch (this.parameterObject.class) {
        case 'boolean':
        case 'TrueClass':
        case 'FalseClass':
        case 'java.lang.Boolean':
          return 'bool';

        case 'status':
        case 'byte':
        case 'short':
        case 'int':
        case 'long':
        case 'Number':
        case 'Integer':
        case 'java.lang.Byte':
        case 'java.lang.Short':
        case 'java.lang.Integer':
        case 'java.lang.Long':
          return 'int';

        case 'float':
        case 'double':
        case 'BigDecimal':
        case 'Float':
        case 'java.lang.Float':
        case 'java.lang.Double':
          return 'float';

        case 'mime_type':
        case 'char':
        case 'String':
        case 'java.lang.Char':
        case 'java.lang.String':
          return 'string';

        default:
          return 'object';
      }
    },
    portType() {
      return this.parameterObject.value
        ? 'port-connected'
        : 'port-disconnected';
    },
    popperPlacement() {
      return this.type === 'input' ? 'left' : 'right';
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
  vertical-align: middle;

  &--type-int {
    fill: #f92672;
  }

  &--type-string {
    fill: #a6e22e;
  }

  &--type-bool {
    fill: #66d9ef;
  }

  &--type-float {
    fill: #fd971f;
  }

  &--type-object {
    fill: #ae81ff;
  }
}
</style>
