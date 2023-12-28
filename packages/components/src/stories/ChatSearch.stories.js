import VChatSearch from '@/pages/ChatSearch.vue';
import './scss/vscode.scss';
import orderData from './data/scenario.json';
import petclinicData from './data/java_scenario.json';
import longPackageData from './data/long-package.appmap.json';

export default {
  title: 'Pages/ChatSearch',
  component: VChatSearch,
  argTypes: {},
};

export const chatSearch = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatSearch },
  template: `<v-chat-search v-bind="$props"></v-chat-search>`,
});
chatSearch.args = {};

export const chatSearchMock = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatSearch },
  template: `<v-chat-search v-bind="$props"></v-chat-search>`,
});

export const chatSearchMockSearchPrepopulated = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatSearch },
  template: `<v-chat-search v-bind="$props"></v-chat-search>`,
});

const MOCK_EXPLANATION = `Based on the code snippets provided, it appears that the code is related to user management in a Rails application. Here is a summary of the functionality:

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
`;

const DATA_BY_PATH = {
  'tmp/appmap/rspec/order_test': orderData,
  'tmp/appmap/junit/petclinic_test': petclinicData,
  'tmp/appmap/minitest/Users_signup_valid_signup_information_with_account_activation':
    longPackageData,
};
const DATA_KEYS = Object.keys(DATA_BY_PATH);

let requestIndex = 0;
let statusIndex = 0;
const requestId = () => `request-${requestIndex}`;

const searchResponse = {
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

const mockRpc = (method, params, callback) => {
  if (method === 'explain') {
    callback(null, null, requestId());
  } else if (method === 'explain.status') {
    const responseIndex = statusIndex % 3;
    statusIndex += 1;
    if (responseIndex === 0) callback(null, null, { step: 'build-vector-terms' });
    if (responseIndex === 1)
      setTimeout(() => callback(null, null, { step: 'explain', searchResponse }), 500);
    if (responseIndex === 2)
      setTimeout(() => {
        requestIndex += 1;
        callback(null, null, { step: 'complete', searchResponse, explanation: MOCK_EXPLANATION });
      }, 500);
  } else if (method.split('.')[0] === 'appmap') {
    const appmapId = params.appmap;
    const data = DATA_BY_PATH[appmapId];

    if (method === 'appmap.data') {
      callback(null, null, data);
    }
    if (method === 'appmap.metadata') {
      callback(null, null, data.metadata);
    }
  }
};

chatSearchMock.args = {
  appmapRpcFn: mockRpc,
};

chatSearchMockSearchPrepopulated.args = {
  appmapRpcFn: mockRpc,
  question: 'How does password reset work?',
};
