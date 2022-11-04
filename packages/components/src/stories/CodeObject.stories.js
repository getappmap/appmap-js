import VCodeObject from '@/components/CodeObject.vue';

export default {
  title: 'AppLand/UI/Code Object',
  component: VCodeObject,
  args: {
    codeObject: {
      name: 'function:app/models/User.find',
      returnValues: [true, 12, 'an object'],
      httpServerRequests: ['POST /microposts', 'GET /micropost/:id'],
      sqlQueries: ['BEGIN transaction', 'SELECT * FROM users', 'END transaction'],
      sqlTables: ['users'],
      packageTrigrams: [['app/controllers', 'app/users', 'database']],
      classTrigrams: [['app/controllers/UsersController', 'app/users/User', 'database:Database']],
      functionTrigrams: [
        [
          'app/controllers/UsersController#list',
          'app/users/User.list',
          'query:SELECT * FROM users',
        ],
      ],
    },
  },
};

export const component = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VCodeObject },
  template: '<v-code-object v-bind="$props" />',
});
