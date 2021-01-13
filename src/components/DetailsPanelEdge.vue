<template>
  <div class="details-panel-edge">
    <v-details-panel-header object-type="Edge" :title="title" />
    <v-details-panel-list title="Events" :items="events" />
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

function eventMatchesIdentifier(id, event) {
  if (event.codeObject) {
    return event.codeObject.classOf === id || event.codeObject.packageOf === id;
  }

  if (event.definedClass === id) {
    return true;
  }

  if (id === 'SQL' && event.sql) {
    return true;
  }

  if (event.http_server_request) {
    if (id === 'HTTP') {
      return true;
    }

    /* eslint-disable camelcase */
    const { path_info, request_method } = event.http_server_request;
    return id === `${request_method} ${path_info}`;
    /* eslint-enable camelcase */
  }

  return false;
}

function eventName(event) {
  if (event.codeObject) {
    return event.codeObject.id;
  }

  if (event.sql) {
    return 'SQL query';
  }

  if (event.http_server_request) {
    /* eslint-disable camelcase */
    const { path_info, request_method } = event.http_server_request;
    return `${request_method} ${path_info}`;
    /* eslint-enable camelcase */
  }

  const { definedClass, isStatic, methodId } = event;
  return `${definedClass}${isStatic ? '#' : '.'}${methodId}`;
}

export default {
  name: 'v-details-panel-edge',
  components: {
    VDetailsPanelList,
    VDetailsPanelHeader,
  },
  props: {
    objectDescriptor: {
      type: Object,
      required: true,
    },
  },
  methods: {
    resolveIdentifier(identifier) {
      const { appMap } = this.$store.state;
      const codeObjects = appMap.classMap.search(identifier);
      if (codeObjects.length > 0) {
        const { type, id } = codeObjects[0];
        return { kind: type, id };
      }

      const events = appMap.events
        .filter((e) => {
          /* eslint-disable camelcase */
          if (e.isReturn()) {
            return false;
          }

          if (e.http_server_request) {
            const { path_info, request_method } = e.http_server_request;
            return identifier === `${request_method} ${path_info}`;
          }

          return false;
          /* eslint-enable camelcase */
        });

      if (events.length > 0) {
        return {
          kind: 'route',
          object: events,
        };
      }

      return null;
    },
  },
  computed: {
    title() {
      return `${this.objectDescriptor.from} to ${this.objectDescriptor.to}`;
    },

    from() {
      const val = [];
      const fromInfo = this.resolveIdentifier(this.objectDescriptor.from);
      if (fromInfo) {
        val.push({ ...fromInfo, text: this.objectDescriptor.from });
      }
      return val;
    },

    to() {
      const val = [];
      const toInfo = this.resolveIdentifier(this.objectDescriptor.to);
      if (toInfo) {
        val.push({ ...toInfo, text: this.objectDescriptor.to });
      }
      return val;
    },

    events() {
      const { appMap } = this.$store.state;
      const { from, to } = this.objectDescriptor;

      return appMap
        .events
        .filter((e) => eventMatchesIdentifier(from, e))
        .filter((e) => e.children
          && e.children.filter((child) => eventMatchesIdentifier(to, child)))
        .map((e) => ({
          kind: 'event',
          text: eventName(e),
          object: e,
        }));
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel-edge {
  padding: 0;
  h5 {
    color: lighten($gray4,15);
    font-size: 1.1rem;
    font-weight: 500;
    line-height: 1.2;
    padding: 0 2rem;
    margin: 0 0 .25rem 0;
  }
}
</style>
