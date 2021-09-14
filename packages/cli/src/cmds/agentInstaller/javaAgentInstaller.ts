/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { GradleInstaller } from './gradleInstaller';
import { MavenInstaller } from './mavenInstaller';

const JavaAgentInstaller = {
  name: 'Java',
  documentation: 'https://appland.com/docs/reference/appmap-java',
  installers: [MavenInstaller, GradleInstaller],
};

export default JavaAgentInstaller;
