import VRecordAppMaps from '@/pages/install-guide/RecordAppMaps.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages/Record AppMaps',
  component: VRecordAppMaps,
  args: {},
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VRecordAppMaps },
  computed: {
    statusStates() {
      return [2, this.complete ? 2 : 1, this.complete ? 1 : 0, 0, 0];
    },
  },
  template: '<v-record-app-maps v-bind="$props" :status-states="statusStates"/>',
});

export const railsRspec = Template.bind({});
railsRspec.args = {
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

export const railsOnly = Template.bind({});
railsOnly.args = {
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

export const rspecOnly = Template.bind({});
rspecOnly.args = {
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

export const rubyOnly = Template.bind({});
rubyOnly.args = {
  project: {
    name: 'MyOtherProject',
    score: 3,
    path: '/home/user/my_other_project',
    language: {
      name: 'Ruby',
      score: 3,
    },
  },
  editor: 'vscode',
  complete: true,
};

export const vscodeJUnitSpring = Template.bind({});
vscodeJUnitSpring.args = {
  project: {
    name: 'MyOtherProject',
    score: 3,
    path: '/home/user/my_other_project',
    language: {
      name: 'Java',
      score: 2,
    },
    testFramework: {
      name: 'JUnit',
      score: 2,
    },
    webFramework: {
      name: 'Spring',
      score: 2,
    },
  },
  editor: 'vscode',
  complete: true,
};

export const intellijJUnitSpring = Template.bind({});
intellijJUnitSpring.args = {
  project: {
    name: 'MyOtherProject',
    score: 3,
    path: '/home/user/my_other_project',
    language: {
      name: 'Java',
      score: 2,
    },
    testFramework: {
      name: 'JUnit',
      score: 2,
    },
    webFramework: {
      name: 'Spring',
      score: 2,
    },
  },
  editor: 'jetbrains',
  complete: true,
};

export const intellijJUnit = Template.bind({});
intellijJUnit.args = {
  project: {
    name: 'MyOtherProject',
    score: 3,
    path: '/home/user/my_other_project',
    language: {
      name: 'Java',
      score: 2,
    },
    testFramework: {
      name: 'JUnit',
      score: 2,
    },
  },
  editor: 'jetbrains',
  complete: true,
};

export const intellijSpring = Template.bind({});
intellijSpring.args = {
  project: {
    name: 'MyOtherProject',
    score: 3,
    path: '/home/user/my_other_project',
    language: {
      name: 'Java',
      score: 2,
    },
    webFramework: {
      name: 'Spring',
      score: 2,
    },
  },
  editor: 'jetbrains',
  complete: true,
};

export const flaskUnittest = Template.bind({});
flaskUnittest.args = {
  project: {
    name: 'MyProject',
    score: 3,
    path: '/home/user/my_project',
    language: {
      name: 'Python',
      score: 2,
    },
    testFramework: {
      name: 'unittest',
      score: 2,
    },
    webFramework: {
      name: 'Flask',
      score: 2,
    },
  },
  editor: 'vscode',
};

export const pythonOnly = Template.bind({});
pythonOnly.args = {
  project: {
    name: 'MyProject',
    score: 3,
    path: '/home/user/my_project',
    language: {
      name: 'Python',
      score: 2,
    },
  },
  editor: 'vscode',
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
