/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { MavenInstaller } from './mavenInstaller';
import { GradleInstaller } from './gradleInstaller';

const JavaAgentInstaller = {
  name: 'Java',
  documentation: 'https://appland.com/docs/reference/appmap-java',
  installers: [MavenInstaller, GradleInstaller],
};

export default JavaAgentInstaller;
