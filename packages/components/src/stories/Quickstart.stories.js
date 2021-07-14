import Quickstart, { Steps } from '@/pages/Quickstart.vue';

export default {
  title: 'Pages/VS Code',
  component: Quickstart,
  args: {
    language: 'ruby',
    testFrameworks: {
      minitest: 'APPMAP=true bundle exec rails test',
      rspec: 'APPMAP=true bundle exec rake',
    },
    stepsState: ['incomplete', 'incomplete', 'incomplete'],
    installSnippets: {
      ruby: 'gem "appmap", "= 0.53.0", :groups => [:development, :test]',
      java: 'java -jar appmap.jar',
      python: 'pip install appmap',
    },
    appmapYmlSnippet: `# AppMap RUBY template
# 'name' should generally be the same as the code repo name.
 name: my_project
 packages:
 - path: app/controllers
 - path: app/models
 # Include the gems that you want to see in the dependency maps.
 # These are just examples.
 - gem: activerecord
 - gem: devise`,
    // appmapsProgress: 1,
    appmaps: [
      {
        name: 'Appmap 1',
        path: '/path/to/appmap',
        requests: 4,
        sqlQueries: 29,
        functions: 136,
      },
      {
        name: 'Appmap 2',
        path: '/another/path/to/appmap',
        requests: 1,
        sqlQueries: 15,
        functions: 22,
      },
      {
        name: 'Appmap 3',
        path: '/one/more/path/to/appmap',
        requests: 12,
        sqlQueries: 7,
        functions: 279,
      },
    ],
    onAction(language, step, data = {}) {
      console.log(data);
      return new Promise((resolve) => {
        setTimeout(() => {
          this.$set(
            this.stepsState,
            Object.values(Steps).indexOf(step),
            'complete'
          );
          resolve(true);
        }, 1000);
      });
    },
    // error: 'The AppMap agent was not installed',
  },
};

export const quickstart = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { Quickstart },
  template: '<quickstart v-bind="$props" ref="quickstart" />',
  mounted() {
    /*
    this.$refs.quickstart.projectSelector([
      {name: 'Ruby', path: '/'},
      {name: 'Java', path: '/'},
      {name: 'Python', path: '/'},
    ]);
    */
    this.$refs.quickstart.$on('openAppmap', (path) => {
      console.log(path);
    });
  },
});
