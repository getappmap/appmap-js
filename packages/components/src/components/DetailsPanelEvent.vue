<template>
  <div class="details-panel-event">
    <v-details-panel-header
      object-type="Event"
      :object="object"
      :title="title"
      :object-id="object.id.toString()"
    />

    <v-sql-code
      v-if="hasSql"
      :sql="object.sql.sql"
      :database="object.sql.database_type"
    />

    <div class="event-params" v-if="hasParameters">
      <h5>Parameters</h5>
      <ul class="event-params__list">
        <li
          class="event-params__item"
          v-for="(param, index) in object.parameters"
          :key="index"
        >
          <p class="event-params__item-key">{{ param.name }}</p>
          <code>{{ param.value }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="hasMessage">
      <h5>Parameters</h5>
      <ul class="event-params__list">
        <li
          class="event-params__item"
          v-for="(param, index) in object.message"
          :key="index"
        >
          <p class="event-params__item-key">
            {{ param.name }}:
            <span class="event-params__item-class">{{ param.class }}</span>
          </p>
          <code>{{ param.value }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="requestHeaders.length">
      <h5>Request headers</h5>
      <ul class="event-params__list">
        <li
          class="event-params__item"
          v-for="param in requestHeaders"
          :key="param.name"
        >
          <p class="event-params__item-key">
            {{ param.name }}:
            <span class="event-params__item-class">{{ param.class }}</span>
          </p>
          <code>{{ param.value }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="Object.keys(httpServerResponse).length">
      <h5>HTTP response details</h5>
      <ul class="event-params__list">
        <li
          class="event-params__item"
          v-for="(v, k) in httpServerResponse"
          :key="k"
        >
          <p class="event-params__item-key">{{ k }}</p>
          <code>{{ v }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="responseHeaders.length">
      <h5>Response headers</h5>
      <ul class="event-params__list">
        <li
          class="event-params__item"
          v-for="param in responseHeaders"
          :key="param.name"
        >
          <p class="event-params__item-key">{{ param.name }}</p>
          <code>{{ param.value }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="object.exceptions.length">
      <h5>Exceptions</h5>
      <ul class="event-params__list">
        <li
          class="event-params__item"
          v-for="exception in object.exceptions"
          :key="exception.object_id"
        >
          <p class="event-params__item-key">{{ exception.class }}</p>
          <code>{{ exception.message }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="hasReturnValue">
      <h5>Return value</h5>
      <ul class="event-params__list">
        <li class="event-params__item">
          <p class="event-params__item-key">{{ object.returnValue.class }}</p>
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
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';
import VSqlCode from '@/components/SqlCode.vue';

export default {
  name: 'v-details-panel-event',
  components: {
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

    requestHeaders() {
      const { httpClientRequest } = this.object;
      if (!httpClientRequest) {
        return [];
      }

      return Object.entries(httpClientRequest.headers || {}).map(
        ([name, value]) => ({
          name,
          value,
        })
      );
    },

    responseHeaders() {
      const { httpClientResponse } = this.object;
      if (!httpClientResponse) {
        return [];
      }

      return Object.entries(httpClientResponse.headers || {}).map(
        ([name, value]) => ({
          name,
          value,
        })
      );
    },

    httpServerResponse() {
      const response = {
        ...(this.object.httpServerResponse ||
          this.object.httpClientResponse ||
          {}),
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

    caller() {
      return this.object.parent ? [this.object.parent] : null;
    },
  },
};
</script>

<style scoped lang="scss">
@font-face {
  font-family: 'IBM Plex Mono';
  src: local('IBM Plex Mono'),
    url(../assets/fonts/IBM_Plex_Mono/IBMPlexMono-Regular.ttf)
      format('truetype');
}
.details-panel-event {
  h3 {
    padding: 0;
  }
  .event-params {
    margin-bottom: 1rem;
    border-radius: $border-radius;
    padding: 0.5rem;
    color: $base03;
    background-color: rgba(0, 0, 0, 0.1);

    h5 {
      margin: 0 0 0.25rem;
      border-radius: 0.25rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: bold;
      text-transform: uppercase;
      color: $base03;
      background-color: $base11;
    }

    &__list {
      margin: 0;
      padding: 0;
      list-style-type: none;
    }

    &__item {
      border-bottom: 1px solid #333a4d;
      padding: 0 0 0.25rem;
      transition: $transition;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 0.75rem;
      font-family: 'IBM Plex Mono', 'Helvetica Monospaced', Helvetica, Arial;

      &-key {
        margin: 0.25rem 0;
      }

      &-class {
        color: $teal;
      }

      code {
        border-radius: $border-radius;
        padding: 0.5rem;
        background-color: rgba(0, 0, 0, 0.1);
        color: inherit;
      }

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
  margin-bottom: 1rem;
  padding: 0;
}
</style>
