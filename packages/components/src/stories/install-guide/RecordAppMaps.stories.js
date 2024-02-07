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
      return [2, this.complete ? 2 : 1, this.complete ? 1 : 0, 0];
    },
  },
  template: '<v-record-app-maps v-bind="$props" :status-states="statusStates"/>',
});

export const RailsRspec = Template.bind({});
RailsRspec.args = {
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

export const RailsOnly = Template.bind({});
RailsOnly.args = {
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

export const RspecOnly = Template.bind({});
RspecOnly.args = {
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

export const RubyOnly = Template.bind({});
RubyOnly.args = {
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

export const VscodeJUnitSpring = Template.bind({});
VscodeJUnitSpring.args = {
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

export const IntellijJUnitSpring = Template.bind({});
IntellijJUnitSpring.args = {
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

export const IntellijJUnit = Template.bind({});
IntellijJUnit.args = {
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

export const IntellijSpring = Template.bind({});
IntellijSpring.args = {
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

export const FlaskUnittest = Template.bind({});
FlaskUnittest.args = {
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

export const PythonOnly = Template.bind({});
PythonOnly.args = {
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

export const JavaScriptOnly = Template.bind({});
JavaScriptOnly.args = {
  project: {
    name: 'JSProject',
    score: 3,
    path: '/home/user/js_project',
    language: {
      name: 'JavaScript',
      score: 2,
    },
  },
  editor: 'vscode',
  complete: true,
};

export const JavaScriptExpress = Template.bind({});
JavaScriptExpress.args = {
  project: {
    name: 'JSExpress',
    score: 3,
    path: '/home/user/js_express',
    language: {
      name: 'JavaScript',
      score: 2,
    },
    webFramework: {
      name: 'express.js',
      score: 2,
    },
  },
  editor: 'vscode',
  complete: true,
};

export const JavaScriptMocha = Template.bind({});
JavaScriptMocha.args = {
  project: {
    name: 'JSMocha',
    score: 3,
    path: '/home/user/js_mocha',
    language: {
      name: 'JavaScript',
      score: 2,
    },
    testFramework: {
      name: 'mocha',
      score: 2,
    },
  },
  editor: 'vscode',
  complete: true,
};

export const JavaScriptMochaExpress = Template.bind({});
JavaScriptMochaExpress.args = {
  project: {
    name: 'JSMochaExpress',
    score: 3,
    path: '/home/user/js_mocha_express',
    language: {
      name: 'JavaScript',
      score: 2,
    },
    webFramework: {
      name: 'express.js',
      score: 2,
    },
    testFramework: {
      name: 'mocha',
      score: 2,
    },
  },
  editor: 'vscode',
  complete: true,
};

export const UnsupportedLanguage = Template.bind({});
UnsupportedLanguage.args = {
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
