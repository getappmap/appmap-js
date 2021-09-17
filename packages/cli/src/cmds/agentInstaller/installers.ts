import { GradleInstaller, MavenInstaller } from './javaAgentInstaller';
import { PipInstaller, PoetryInstaller } from './pythonAgentInstaller';
import { BundleInstaller } from './rubyAgentInstaller';

const Installers = [
  BundleInstaller,
  MavenInstaller,
  GradleInstaller,
  PipInstaller,
  PoetryInstaller,
];

export default Installers;
