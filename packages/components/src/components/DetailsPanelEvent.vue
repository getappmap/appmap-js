<template>
  <div class="details-panel-event">
    <v-details-panel-header
      object-type="Event"
      :object="object"
      :title="title"
      :object-id="object.id.toString()"
    >
      <template v-slot:links>
        <v-details-button v-if="shouldDisplayViewEvent" @click.native="viewEvent">
          Show in Trace
        </v-details-button>
      </template>
    </v-details-panel-header>

    <v-sql-code v-if="hasSql" :sql="object.sql.sql" :database="object.sql.database_type" />

    <v-details-panel-list
      class="findings"
      title="Associated findings"
      v-if="hasFindings"
      :items="findings"
    />

    <div class="event-params" v-if="hasParameters">
      <h5>Parameters</h5>
      <ul class="table-01">
        <li v-for="(param, index) in object.parameters" :key="index">
          <strong>{{ param.name }}</strong>
          <code>{{ param.value }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="hasMessage">
      <h5>Parameters</h5>
      <ul class="table-01">
        <li v-for="(param, index) in object.message" :key="index">
          <i>{{ param.class }}</i>
          <strong>{{ param.name }}</strong>
          <code>{{ param.value }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="requestHeaders.length">
      <h5>Request headers</h5>
      <ul class="table-01">
        <li v-for="param in requestHeaders" :key="param.name">
          <i>{{ param.class }}</i>
          <strong>{{ param.name }}</strong>
          <code>{{ param.value }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="Object.keys(httpServerResponse).length">
      <h5>HTTP response details</h5>
      <ul class="table-01">
        <li v-for="(v, k) in httpServerResponse" :key="k">
          <strong>{{ k }}</strong>
          <code>{{ v }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="responseHeaders.length">
      <h5>Response headers</h5>
      <ul class="table-01">
        <li v-for="param in responseHeaders" :key="param.name">
          <strong>{{ param.name }}</strong>
          <code>{{ param.value }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="object.exceptions.length">
      <h5>Exceptions</h5>
      <ul class="table-01">
        <li v-for="exception in object.exceptions" :key="exception.object_id">
          <strong>{{ exception.class }}</strong>
          <code>{{ exception.message }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="hasReturnValue">
      <h5>Return value</h5>
      <ul class="table-01">
        <li>
          <i>{{ object.returnValue.class }}</i>
          <code>{{ object.returnValue.value }}</code>
        </li>
      </ul>
    </div>

    <v-details-panel-list title="Caller" :items="caller" />
    <v-details-panel-list title="Children" :items="object.children" />
  </div>
</template>

<script>
import { getSqlLabel } from '@appland/models';
import VDetailsButton from '@/components/DetailsButton.vue';
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';
import VSqlCode from '@/components/SqlCode.vue';
import { SET_VIEW, VIEW_FLOW } from '@/store/vsCode';
import { toListItem } from '@/lib/finding';

export default {
  name: 'v-details-panel-event',
  components: {
    VDetailsButton,
    VDetailsPanelList,
    VDetailsPanelHeader,
    VSqlCode,
  },
  props: {
    object: {
      type: Object,
      required: true,
    },
  },
  computed: {
    title() {
      if (this.object.sqlQuery) {
        return getSqlLabel(this.object);
      }

      return this.object.toString();
    },

    hasParameters() {
      return this.object.parameters && this.object.parameters.length;
    },

    hasMessage() {
      return this.object.message && this.object.message.length;
    },

    hasFindings() {
      return Array.isArray(this.object.findings) && this.object.findings.length;
    },

    requestHeaders() {
      const { httpClientRequest } = this.object;
      if (!httpClientRequest) {
        return [];
      }

      return Object.entries(httpClientRequest.headers || {}).map(([name, value]) => ({
        name,
        value,
      }));
    },

    responseHeaders() {
      const { httpClientResponse } = this.object;
      if (!httpClientResponse) {
        return [];
      }

      return Object.entries(httpClientResponse.headers || {}).map(([name, value]) => ({
        name,
        value,
      }));
    },

    httpServerResponse() {
      const response = {
        ...(this.object.httpServerResponse || this.object.httpClientResponse || {}),
      };

      if (response.headers) {
        delete response.headers;
      }

      return response;
    },

    hasSql() {
      return Boolean(this.object.sql);
    },

    hasReturnValue() {
      return Boolean(this.object.returnValue);
    },

    shouldDisplayViewEvent() {
      return this.$store.state.currentView !== VIEW_FLOW;
    },

    caller() {
      return this.object.parent ? [this.object.parent] : null;
    },

    findings() {
      return (this.object.findings || []).map(toListItem);
    },
  },

  methods: {
    viewEvent() {
      this.$store.commit(SET_VIEW, VIEW_FLOW);
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel-event {
  h3 {
    padding: 0;
  }

  .event-params {
    padding: 0;
    //color: $base11;
    h5 {
      color: $gray4;
      font-size: 0.9rem;
      line-height: 1.2;
      margin: 0 0 0.25rem 0;
      padding: 0;
      text-transform: uppercase;
    }
    .table-01 {
      font-size: 14px;
      font-family: sans-serif;
      font-weight: 500;
      li {
        padding: 0.5rem;
      }
    }
  }
  ul {
    list-style-type: none;
    padding: 0;
    margin: 0 0 1.5rem 0;
    width: 100%;
    li {
      width: 100%;
      border-bottom: 1px solid $gray3;
      padding: 0.5rem;
      transition: $transition;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 0.4rem;
      a {
        margin: 0;
        width: 100%;
      }
    }
  }
}
</style>
<style scoped>
.details-panel-event >>> .sql-code {
  margin-bottom: 8px;
  padding: 0;
}
</style>
