import vuetify from './vuetifyStorybook';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  docs: {
    source: {
      type: 'code',
    },
  },
};

export const decorators = [
  () => ({
    vuetify,
    template: `
    <v-app style="font-family: 'Raleway, sans-serif' !important;">
      <v-main>
        <v-container fluid >
          <story/>
        </v-container>
      </v-main>
    </v-app>
    `,
  }),
];
