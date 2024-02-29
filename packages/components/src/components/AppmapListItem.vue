<template>
  <div class="appmap-list-item" @click="openAppMap">
    <component :is="icon" class="appmap-list-item--icon" />
    <span :class="nameClass" data-cy="name">{{ name }}</span>
    <span class="appmap-list-item--time" data-cy="time">{{ time }}</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VIconRecordCodeBlock from '@/assets/record-code-block.svg';
import VIconRecordProcess from '@/assets/record-process.svg';
import VIconRecordRemote from '@/assets/record-remote.svg';
import VIconRecordRequest from '@/assets/record-request.svg';
import VIconRecordTest from '@/assets/record-test.svg';

export default Vue.extend({
  name: 'v-appmap-list-item',
  components: {
    VIconRecordCodeBlock,
    VIconRecordProcess,
    VIconRecordRemote,
    VIconRecordRequest,
    VIconRecordTest,
  },
  props: {
    recordingMethod: String,
    name: String,
    createdAt: String,
    path: String,
  },
  computed: {
    icon() {
      switch (this.recordingMethod) {
        case 'process':
          return VIconRecordProcess;
        case 'remote':
          return VIconRecordRemote;
        case 'request':
        case 'requests':
          return VIconRecordRequest;
        case 'test':
        case 'tests':
          return VIconRecordTest;
        default:
          return VIconRecordCodeBlock;
      }
    },
    time(): string {
      return new Date(this.createdAt).toLocaleString();
    },
    nameClass(): Record<string, boolean> {
      return {
        'appmap-list-item--name': true,
        'appmap-list-item--mono': this.recordingMethod === 'requests',
      };
    },
  },
  methods: {
    openAppMap() {
      this.$root.$emit('open-appmap', this.path);
    },
  },
});
</script>

<style lang="scss" scoped>
$fg: #ececec;

.appmap-list-item {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  gap: 1rem;
  align-items: center;
  color: $fg;
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &--icon {
    width: 24px;
    height: 24px;

    path,
    g {
      fill: $fg;
    }
  }

  &--name {
    // max 3 lines of text
    // followed by ellipsis on overflow
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &--mono {
    font-family: monospace;
  }

  &--time {
    font-weight: 200;
  }

  &:hover {
    background-color: rgba(200, 200, 255, 0.25) !important;
  }
}
</style>
