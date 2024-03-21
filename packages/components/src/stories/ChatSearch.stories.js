import VChatSearch from '@/pages/ChatSearch.vue';
import './scss/vscode.scss';
import orderData from './data/scenario.json';
import petclinicData from './data/java_scenario.json';
import longPackageData from './data/long-package.appmap.json';
import savedFilters from './data/saved_filters.js';

const code = `class UsersController < ApplicationController
  before_action :correct_user,   only: [:edit, :update]
  before_action :admin_user,     only: :destroy
  
  def index
    @users = User.where(activated: true).paginate(page: params[:page])
  end
  
  def show
    @user = User.find(params[:id])
    redirect_to root_url and return unless @user.activated?
  end
`;

const codeSelection = {
  path: 'app/controllers/users_controller.rb',
  lineStart: 6,
  lineEnd: 17,
  code,
};

const appmaps = [
  'tmp/appmap/rspec/GET_organizations_join_by_code_when_logged_in_with_invalid_join_code_is_not_found',
];

const mostRecentAppMaps = [orderData, petclinicData, longPackageData].map((appmap, i) => ({
  recordingMethod: appmap.metadata.recorder.type || 'tests',
  name: appmap.metadata.name,
  createdAt: '2024-02-28T18:06:23Z',
  path: `tmp/appmap/${i}.appmap.json`,
}));

const appmapStats = [
  {
    name: 'example',
    numAppMaps: mostRecentAppMaps.length,
    packages: Array.from({ length: 4 }, (_, i) => `app/controllers/${i}`),
    classes: Array.from({ length: 6 }, (_, i) => `Model${i}`),
    routes: Array.from({ length: 8 }, (_, i) => `GET /users/${i}`),
    tables: Array.from({ length: 7 }, (_, i) => `table_${i}`),
  },
];

export default {
  title: 'Pages/ChatSearch',
  component: VChatSearch,
  argTypes: {},
};

export const ChatSearch = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatSearch },
  template: `<v-chat-search v-bind="$props" ref="chatSearch"></v-chat-search>`,
  mounted() {
    this.$refs.chatSearch.setAppMapStats(appmapStats);
  },
});
ChatSearch.args = {
  mostRecentAppMaps,
  appmapYmlPresent: true,
};

export const ChatSearchWithCodeSelection = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatSearch },
  template: `<v-chat-search v-bind="$props" ref="chatSearch"></v-chat-search>`,
  mounted() {
    this.$refs.chatSearch.includeCodeSelection(codeSelection);
  },
});
ChatSearchWithCodeSelection.args = {
  mostRecentAppMaps,
  appmapYmlPresent: true,
};

export const ChatSearchWithAppMaps = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatSearch },
  template: `<v-chat-search v-bind="$props" ref="chatSearch"></v-chat-search>`,
  mounted() {
    for (const appmap of appmaps) this.$refs.chatSearch.includeAppMap(appmap);
  },
});

export const ChatSearchWithTargetAppMap = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatSearch },
  template: `<v-chat-search v-bind="$props" ref="chatSearch"></v-chat-search>`,
});
ChatSearchWithTargetAppMap.args = {
  targetAppmapData: petclinicData,
  targetAppmapFsPath: 'fake/path',
};

export const ChatSearchMock = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatSearch },
  template: `<v-chat-search v-bind="$props" ref="chatSearch"></v-chat-search>`,
  mounted() {
    this.$refs.chatSearch.setAppMapStats(appmapStats);
  },
});

export const ChatSearchMockWithCodeSelection = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatSearch },
  template: `<v-chat-search v-bind="$props" ref="chatSearch"></v-chat-search>`,
  mounted() {
    this.$refs.chatSearch.includeCodeSelection(codeSelection);
  },
});

export const ChatSearchMockWithFilters = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatSearch },
  template: `<v-chat-search v-bind="$props"></v-chat-search>`,
});

export const ChatSearchMockSearchPrepopulated = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatSearch },
  template: `<v-chat-search v-bind="$props" ref="chatSearch"></v-chat-search>`,
  mounted() {
    this.$refs.chatSearch.setAppMapStats(appmapStats);
  },
});

export const ChatSearchMockSearchPrepopulatedEmptyResults = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatSearch },
  template: `<v-chat-search v-bind="$props" ref="chatSearch"></v-chat-search>`,
  mounted() {
    this.$refs.chatSearch.setAppMapStats([{ numAppMaps: 0 }]);
  },
});

const MOCK_EXPLANATION =
  `Based on the code snippets provided, it appears that the code is related to user management in a Rails application. Here is a summary of the functionality:

1. The \`UsersHelper\` module defines a helper method \`gravatar_for\` that generates a Gravatar URL for a given user.

2. The \`SessionsHelper\` module defines a method \`current_user\` that returns the currently logged-in user based on the session and remember token cookies.

3. The \`UsersController\` class handles user-related actions such as displaying a list of users, showing user profiles, creating new users, and editing user profiles.

4. The \`UsersController\` uses before action filters to ensure that certain actions require the user to be logged in (\`logged_in_user\`), the correct user (\`correct_user\`), or an admin user (\`admin_user\`).

5. The \`UsersController\` also defines a \`create\` action for creating new users and an \`edit\` action for editing user profiles.

6. The \`User\` model defines methods for remembering a user in the database for persistent sessions (\`remember\`), generating a session token to prevent session hijacking (\`session_token\`), and generating a hash digest of a string (\`digest\`) and a random token (\`new_token\`).

7. The \`show.html.erb\` view displays user information, including the user's name, gravatar, and microposts.

8. The \`new.html.erb\` view displays a form for signing up a new user.

9. The \`edit.html.erb\` view displays a form for editing a user's profile.

Overall, this code provides functionality for user authentication, user creation, and user profile management in a Rails application.
`.split('\n');

const DATA_BY_PATH = {
  'tmp/appmap/rspec/order_test': orderData,
  'tmp/appmap/junit/petclinic_test': petclinicData,
  'tmp/appmap/minitest/Users_signup_valid_signup_information_with_account_activation':
    longPackageData,
};
const DATA_KEYS = Object.keys(DATA_BY_PATH);

let requestIndex = 0;
let statusIndex = 0;
const userMessageId = 'user-message-id';
const systemMessageId = 'system-message-id';
const threadId = 'thread-id';

const NonEmptySearchResponse = {
  results: [
    {
      appmap: DATA_KEYS[0],
      events: [
        {
          fqid: 'function:app/controllers/Spree::Admin::OrdersController#edit',
          location: 'app/controllers/spree/admin/orders_controller.rb:10',
          score: 1.0,
          eventIds: [340],
        },
        {
          fqid: 'route:GET /admin',
          location: 'app/controllers/spree/admin/orders_controller.rb:9',
          score: 0.9,
          eventIds: [1],
        },
      ],
      score: 5.0,
    },
    {
      appmap: DATA_KEYS[1],
      events: [
        {
          fqid: 'function:com.example.petclinic.model.Owner#find',
          location: 'src/main/java/com/example/petclinic/model/Owner.java:1',
          score: 1.0,
          eventIds: [1],
        },
      ],
      score: 4.0,
    },
    {
      appmap: DATA_KEYS[2],
      events: [],
      score: 1.0,
    },
  ],
  numResults: 20,
};

const EmptySearchResponse = {
  results: [],
  numResults: 0,
};

const AppmapStats = {
  packages: ['a', 'b', 'c'],
  classes: ['A', 'B', 'C'],
  routes: ['GET /a', 'POST /b', 'PUT /c'],
  tables: ['a', 'b', 'c'],
  numAppMaps: 32,
};

const EmptyAppmapStats = {
  packages: [],
  classes: [],
  routes: [],
  tables: [],
  numAppMaps: 0,
};

function buildMockRpc(searchResponse, explanation, appmapStats = AppmapStats) {
  return (method, params, callback) => {
    if (method === 'explain') {
      statusIndex = 0;
      callback(null, null, { userMessageId, threadId });
    } else if (method === 'explain.status') {
      const responseIndex = statusIndex;
      statusIndex += 1;
      if (responseIndex === 0) callback(null, null, { step: 'build-vector-terms' });
      else if (responseIndex === 1)
        setTimeout(() => callback(null, null, { step: 'explain', searchResponse }), 500);
      else if (responseIndex < explanation.length + 2)
        setTimeout(() => {
          requestIndex += 1;
          callback(null, null, {
            step: 'explain',
            searchResponse,
            explanation: explanation.slice(0, responseIndex - 2).map((line) => `${line}\n`),
          });
        }, 500);
      else
        callback(null, null, {
          step: 'complete',
          searchResponse,
          explanation,
        });
    } else if (method.split('.')[0] === 'appmap') {
      const appmapId = params.appmap;
      const data = DATA_BY_PATH[appmapId];

      if (method === 'appmap.stats') {
        callback(null, null, appmapStats);
      }
      if (method === 'appmap.data') {
        callback(null, null, data);
      }
      if (method === 'appmap.metadata') {
        callback(null, null, data.metadata);
      }
    }
  };
}

const nonEmptyMockRpc = buildMockRpc(NonEmptySearchResponse, MOCK_EXPLANATION);

const emptyMockRpc = buildMockRpc(EmptySearchResponse, [], EmptyAppmapStats);

ChatSearchMock.args = {
  appmapRpcFn: nonEmptyMockRpc,
  appmapYmlPresent: true,
  mostRecentAppMaps,
};

ChatSearchMockWithCodeSelection.args = {
  codeSelection,
  appmapRpcFn: nonEmptyMockRpc,
  savedFilters,
  appmapYmlPresent: true,
  mostRecentAppMaps,
};

ChatSearchMockWithFilters.args = {
  appmapRpcFn: nonEmptyMockRpc,
  savedFilters,
  appmapYmlPresent: true,
  mostRecentAppMaps,
};

ChatSearchMockSearchPrepopulated.args = {
  appmapRpcFn: nonEmptyMockRpc,
  question: 'How does password reset work?',
  appmapYmlPresent: true,
  mostRecentAppMaps,
};

ChatSearchMockSearchPrepopulatedEmptyResults.args = {
  appmapRpcFn: emptyMockRpc,
  question: 'How does password reset work?',
  appmapYmlPresent: true,
};
