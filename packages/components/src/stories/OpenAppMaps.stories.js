import OpenAppMaps from '@/pages/install-guide/OpenAppMaps.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages',
  component: OpenAppMaps,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { OpenAppMaps },
  template: '<OpenAppMaps v-bind="$props" />',
});

export const ExploreAppmapsEmptyPage = Template.bind({});
ExploreAppmapsEmptyPage.args = {};

export const ExploreAppmapsFullPage = Template.bind({});
ExploreAppmapsFullPage.args = {
  appMaps: [
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Microposts_interface_micropost_interface.appmap.json',
      name: 'Microposts_interface micropost interface',
      requests: 7,
      sqlQueries: 242,
      functions: 63,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Users_login_login_with_valid_information_followed_by_logout.appmap.json',
      name: 'Users_login login with valid information followed by logout',
      requests: 6,
      sqlQueries: 43,
      functions: 47,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Password_resets_password_resets.appmap.json',
      name: 'Password_resets password resets',
      requests: 10,
      sqlQueries: 32,
      functions: 50,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Users_signup_valid_signup_information_with_account_activation.appmap.json',
      name: 'Users_signup valid signup information with account activation',
      requests: 7,
      sqlQueries: 24,
      functions: 51,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Users_index_index_as_admin_including_pagination_and_delete_links.appmap.json',
      name: 'Users_index index as admin including pagination and delete links',
      requests: 3,
      sqlQueries: 27,
      functions: 43,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Users_profile_profile_display_while_anonyomus.appmap.json',
      name: 'Users_profile profile display while anonyomus',
      requests: 1,
      sqlQueries: 43,
      functions: 26,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Following_following_page.appmap.json',
      name: 'Following following page',
      requests: 2,
      sqlQueries: 18,
      functions: 42,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Users_edit_unsuccessful_edit.appmap.json',
      name: 'Users_edit unsuccessful edit',
      requests: 3,
      sqlQueries: 16,
      functions: 43,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Following_followers_page.appmap.json',
      name: 'Following followers page',
      requests: 2,
      sqlQueries: 18,
      functions: 42,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Following_should_unfollow_a_user_with_Ajax.appmap.json',
      name: 'Following should unfollow a user with Ajax',
      requests: 2,
      sqlQueries: 22,
      functions: 37,
    },
  ],
  sampleCodeObjects: {
    httpRequests: [
      {
        name: 'DELETE /logout',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Users_login_login_with_valid_information_followed_by_logout.appmap.json',
      },
      {
        name: 'GET /about',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Static_pages_controller_should_get_about.appmap.json',
      },
      {
        name: 'GET /account_activations/{id}/edit',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Users_signup_valid_signup_information_with_account_activation.appmap.json',
      },
      {
        name: 'GET /contact',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Static_pages_controller_should_get_contact.appmap.json',
      },
      {
        name: 'GET /help',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Static_pages_controller_should_get_help.appmap.json',
      },
    ],
    queries: [
      {
        name: 'commit transaction',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Static_pages_controller_should_get_help.appmap.json',
      },
      {
        name: 'DELETE FROM "active_storage_attachments" WHERE "active_storage_attachments"."id" = ?',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Microposts_interface_micropost_interface.appmap.json',
      },
      {
        name: 'DELETE FROM "microposts"',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Static_pages_controller_should_get_help.appmap.json',
      },
      {
        name: 'DELETE FROM "relationships" WHERE "relationships"."id" = ?',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Users_index_index_as_admin_including_pagination_and_delete_links.appmap.json',
      },
      {
        name: 'INSERT INTO "active_storage_attachments" ("name", "record_type", "record_id", "blob_id", "created_at") VALUES (?, ?, ?, ?, ?)',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Microposts_interface_micropost_interface.appmap.json',
      },
    ],
  },
};

export const ExploreAppmapsPartialPage = Template.bind({});
ExploreAppmapsPartialPage.args = {
  appMaps: [
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Microposts_interface_micropost_interface.appmap.json',
      name: 'Microposts_interface micropost interface',
      requests: 7,
      sqlQueries: 242,
      functions: 63,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Users_login_login_with_valid_information_followed_by_logout.appmap.json',
      name: 'Users_login login with valid information followed by logout',
      requests: 6,
      sqlQueries: 43,
      functions: 47,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Password_resets_password_resets.appmap.json',
      name: 'Password_resets password resets',
      requests: 10,
      sqlQueries: 32,
      functions: 50,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Users_signup_valid_signup_information_with_account_activation.appmap.json',
      name: 'Users_signup valid signup information with account activation',
      requests: 7,
      sqlQueries: 24,
      functions: 51,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Users_index_index_as_admin_including_pagination_and_delete_links.appmap.json',
      name: 'Users_index index as admin including pagination and delete links',
      requests: 3,
      sqlQueries: 27,
      functions: 43,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Following_followers_page.appmap.json',
      name: 'Following followers page',
      requests: 2,
      sqlQueries: 18,
      functions: 42,
    },
    {
      path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Following_should_unfollow_a_user_with_Ajax.appmap.json',
      name: 'Following should unfollow a user with Ajax',
      requests: 2,
      sqlQueries: 22,
      functions: 37,
    },
  ],
  sampleCodeObjects: {
    httpRequests: [
      {
        name: 'DELETE /logout',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Users_login_login_with_valid_information_followed_by_logout.appmap.json',
      },
      {
        name: 'GET /about',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Static_pages_controller_should_get_about.appmap.json',
      },
      {
        name: 'GET /contact',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Static_pages_controller_should_get_contact.appmap.json',
      },
      {
        name: 'GET /help',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Static_pages_controller_should_get_help.appmap.json',
      },
    ],
    queries: [
      {
        name: 'DELETE FROM "microposts"',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Static_pages_controller_should_get_help.appmap.json',
      },
      {
        name: 'DELETE FROM "relationships" WHERE "relationships"."id" = ?',
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Users_index_index_as_admin_including_pagination_and_delete_links.appmap.json',
      },
    ],
  },
};
