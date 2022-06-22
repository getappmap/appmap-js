<template>
  <GoodIcon v-if="quality === '3'" />
  <OKIcon v-else-if="quality === '2'" />
  <BadIcon v-else />
</template>

<script>
import GoodIcon from '@/assets/check-circle-outline.svg';
import OKIcon from '@/assets/dash-circle.svg';
import BadIcon from '@/assets/x-circle.svg';

export default {
  name: 'quality-icon',

  components: {
    GoodIcon,
    OKIcon,
    BadIcon,
  },

  props: {
    quality: {
      type: String,
      default: '1',
    },
  },

  data() {
    return {};
  },

  mounted() {},
};
</script>
