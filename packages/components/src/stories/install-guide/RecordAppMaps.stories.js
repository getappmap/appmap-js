import VRecordAppMaps from '@/pages/install-guide/RecordAppMaps.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages/Record AppMaps',
  component: VRecordAppMaps,
  args: {},
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VRecordAppMaps },
  template: '<v-record-app-maps v-bind="$props" />',
});

export const automatedRecording = Template.bind({});
automatedRecording.args = {
  project: {
    name: 'MyOtherProject',
    score: 3,
    path: '/home/user/my_other_project',
    language: {
      name: 'Ruby',
      score: 3,
    },
    testFramework: {
      name: 'RSpec',
      score: 3,
    },
    webFramework: {
      name: 'Rails',
      score: 3,
    },
  },
  editor: 'vscode',
  complete: true,
};

export const noTestFramework = Template.bind({});
noTestFramework.args = {
  project: {
    name: 'MyOtherProject',
    score: 3,
    path: '/home/user/my_other_project',
    language: {
      name: 'Ruby',
      score: 3,
    },
    testFramework: {
      name: '',
      score: 0,
    },
    webFramework: {
      name: 'Rails',
      score: 3,
    },
  },
  editor: 'vscode',
  complete: true,
};

export const noWebFramework = Template.bind({});
noWebFramework.args = {
  project: {
    name: 'MyOtherProject',
    score: 3,
    path: '/home/user/my_other_project',
    language: {
      name: 'Ruby',
      score: 3,
    },
    testFramework: {
      name: 'Minitest',
      score: 2,
    },
    webFramework: {
      name: '',
      score: 0,
    },
  },
  editor: 'vscode',
  complete: true,
};

export const javascriptOrJava = Template.bind({});
javascriptOrJava.args = {
  project: {
    name: 'MyOtherProject',
    score: 3,
    path: '/home/user/my_other_project',
    language: {
      name: 'JavaScript',
      score: 2,
    },
    testFramework: {
      name: 'Mocha',
      score: 3,
    },
    webFramework: {
      name: 'Express',
      score: 3,
    },
  },
  editor: 'vscode',
  complete: true,
};

export const noWebOrTestFramework = Template.bind({});
noWebOrTestFramework.args = {
  project: {
    name: 'MyOtherProject',
    score: 3,
    path: '/home/user/my_other_project',
    language: {
      name: 'JavaScript',
      score: 2,
    },
    testFramework: {
      name: 'Unknown',
      score: 0,
    },
    webFramework: {
      name: 'Unknown',
      score: 0,
    },
  },
  editor: 'vscode',
  complete: true,
};

export const unsupportedLanguage = Template.bind({});
unsupportedLanguage.args = {
  project: {
    name: 'MyOtherProject',
    score: 3,
    path: '/home/user/my_other_project',
    language: {
      name: 'Unknown',
      score: 0,
    },
    testFramework: {
      name: 'Unknown',
      score: 0,
    },
    webFramework: {
      name: 'Unknown',
      score: 0,
    },
  },
  editor: 'vscode',
  complete: true,
};
