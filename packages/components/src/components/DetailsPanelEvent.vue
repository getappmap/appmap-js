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

    <v-list v-if="hasParameters" title="Parameters">
      <v-list-item-param
        v-for="(param, index) in object.parameters"
        :key="index"
        :name="param.name"
        :value="param.value"
      >
        <FindReferencesIcon
          class="details-panel-event__find-references"
          @click="setReference(param)"
        />
      </v-list-item-param>
    </v-list>

    <v-list v-if="hasMessage" title="Parameters">
      <v-list-item-param
        v-for="(param, index) in object.message"
        :key="index"
        :name="param.name"
        :className="param.class"
        :value="param.value"
      >
        <FindReferencesIcon
          class="details-panel-event__find-references"
          @click="setReference(param)"
        />
      </v-list-item-param>
    </v-list>

    <v-list v-if="requestHeaders.length" title="Request headers">
      <v-list-item-param
        v-for="param in requestHeaders"
        :key="param.name"
        :name="param.name"
        :className="param.class"
        :value="param.value"
      />
    </v-list>

    <v-list
      v-if="Object.keys(httpServerResponse).length"
      title="HTTP response details"
    >
      <v-list-item-param
        v-for="(v, k) in httpServerResponse"
        :key="k"
        :name="k"
        :value="v"
      />
    </v-list>

    <v-list v-if="responseHeaders.length" title="Response headers">
      <v-list-item-param
        v-for="param in responseHeaders"
        :key="param.name"
        :name="param.name"
        :value="param.value"
      />
    </v-list>

    <v-list v-if="object.exceptions.length" title="Exceptions">
      <v-list-item-param
        v-for="exception in object.exceptions"
        :key="exception.object_id"
        :name="exception.class"
        :value="exception.message"
      />
    </v-list>

    <v-list v-if="hasReturnValue" title="Return value">
      <v-list-item-param
        :name="object.returnValue.class"
        :value="object.returnValue.value"
      >
        <FindReferencesIcon
          class="details-panel-event__find-references"
          @click="
            setReference({
              name: object.returnValue.class,
              ...object.returnValue,
            })
          "
        />
      </v-list-item-param>
    </v-list>

    <v-details-panel-list title="Caller" :items="caller" />
    <v-details-panel-list title="Children" :items="object.children" />
  </div>
</template>

<script>
import { getSqlLabel } from '@appland/models';
import { SELECT_REFERENCE } from '@/store/vsCode';
import FindReferencesIcon from '@/assets/find-references.svg';
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';
import VList from '@/components/common/List.vue';
import VListItemParam from '@/components/common/ListItemParam.vue';
import VSqlCode from '@/components/SqlCode.vue';

export default {
  name: 'v-details-panel-event',
  components: {
    FindReferencesIcon,
    VDetailsPanelList,
    VDetailsPanelHeader,
    VList,
    VListItemParam,
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

  methods: {
    setReference(param) {
      this.$store.commit(SELECT_REFERENCE, param);
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

  &__find-references {
    flex-shrink: 0;
    margin-left: auto;
    width: 16px;
    height: 17px;
    fill: #bababa;
    cursor: pointer;
  }
}
</style>
<style scoped>
.details-panel-event >>> .sql-code {
  margin-bottom: 1rem;
  padding: 0;
}
</style>
