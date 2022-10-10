import path from 'path';
import fse from 'fs-extra';
import tmp from 'tmp';
import sinon, { SinonStub } from 'sinon';
import inquirer from 'inquirer';
import Telemetry from '../../../src/telemetry';
import yargs from 'yargs';

import { PoetryInstaller } from '../../../src/cmds/agentInstaller/pythonAgentInstaller';
import { BundleInstaller } from '../../../src/cmds/agentInstaller/rubyAgentInstaller';
import AgentInstallerProcedure from '../../../src/cmds/agentInstaller/agentInstallerProcedure';
import * as commandRunner from '../../../src/cmds/agentInstaller/commandRunner';
import CommandStruct, { CommandReturn } from '../../../src/cmds/agentInstaller/commandStruct';
import * as ProjectConfiguration from '../../../src/cmds/agentInstaller/projectConfiguration';

import UI from '../../../src/cmds/userInteraction';
import { ValidationError } from '../../../src/cmds/errors';

import * as validator from '../../../src/service/config/validator';

import 'jest-sinon';
import GradleInstaller from '../../../src/cmds/agentInstaller/gradleInstaller';
import MavenInstaller from '../../../src/cmds/agentInstaller/mavenInstaller';

import * as openTicket from '../../../src/lib/ticket/openTicket';
import { withStubbedTelemetry } from '../../helper';

const fixtureDir = path.join(__dirname, '..', 'fixtures');
tmp.setGracefulCleanup();

const invokeCommand = (
  projectDir: string,
  evalResults: (err: Error | undefined, argv: any, output: string) => void
) => {
  const debugSwitch: string = ''; // to debug, set debugSwitch to -v

  if (debugSwitch !== '-v') {
    // Don't scribble on the console unless we're debugging.
    sinon.stub(UI, 'status').set(() => {});
  }

  return yargs
    .command(require('../../../src/cmds/agentInstaller/install-agent').default)
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging',
    })
    .parse(`install-agent ${debugSwitch} -d ${projectDir}`, {}, (err, argv, output) => {
      evalResults(err, argv, output);
    });
};

describe('install sub-command', () => {
  withStubbedTelemetry(sinon);
  let openTicketStub: sinon.SinonStub;

  let projectDir: string;
  beforeEach(() => {
    projectDir = tmp.dirSync({} as any).name;

    // don't open any tickets
    openTicketStub = sinon.stub(openTicket, 'default');
    openTicketStub.resolves();
  });

  describe('A Java project', () => {
    const testE2E = async (
      verifyJavaVersion: (command: CommandStruct) => Promise<CommandReturn>,
      verifyAgent: (command: CommandStruct) => Promise<CommandReturn>,
      printPath: (command: CommandStruct) => Promise<CommandReturn>,
      initAgent: (command: CommandStruct) => Promise<CommandReturn>,
      validateAgent: (command: CommandStruct) => Promise<CommandReturn>,
      evalResults: (err: Error | undefined, argv: any, output: string) => void
    ) => {
      let callIdx = 0;
      sinon
        .stub(commandRunner, 'run')
        .onCall(callIdx++)
        .callsFake(verifyJavaVersion)
        .onCall(callIdx++)
        .callsFake(verifyAgent)
        .onCall(callIdx++)
        .callsFake(printPath)
        .onCall(callIdx++)
        .callsFake(initAgent)
        .onCall(callIdx++)
        .callsFake(validateAgent);

      return invokeCommand(projectDir, evalResults);
    };

    const expectedConfig = `
# Fake appmap.yml
name: fake-app
packages:
- path: com.fake.Fake
`;

    const initAgent = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('java');
      const args = cmdStruct.args;
      expect(args).toEqual(['-jar', 'appmap.jar', '-d', projectDir, 'init']);
      const fakeConfig = `
    {
       "configuration": {
         "contents": "${expectedConfig.replace(/[\n]/g, '\\n')}"
       }
    }`;
      const ret = { stdout: fakeConfig, stderr: '' };
      return Promise.resolve(ret);
    };

    const validateAgent = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('java');
      const args = cmdStruct.args;
      expect(args).toEqual(['-jar', 'appmap.jar', '-d', projectDir, 'validate']);
      const ret = { stdout: '[]', stderr: '' };
      return Promise.resolve(ret);
    };

    const verifyJavaVersion = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('javac');
      expect(cmdStruct.args).toEqual(['-version']);
      return Promise.resolve({ stdout: '11.0.11', stderr: '' });
    };

    describe('managed with gradle', () => {
      const projectFixture = path.join(fixtureDir, 'java', 'gradle', 'example-project');

      const verifyAgent = (cmdStruct: CommandStruct) => {
        const expectedProgram = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
        expect(cmdStruct.program).toEqual(expectedProgram);
        expect(cmdStruct.args).toEqual([
          'dependencyInsight',
          '--dependency',
          'com.appland:appmap-agent',
          '--configuration',
          'appmapAgent',
          '--stacktrace',
        ]);
        const ret = {
          stdout: '',
          stderr: '',
        };
        return Promise.resolve(ret);
      };

      const printPath = (cmdStruct: CommandStruct) => {
        const expectedProgram = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
        expect(cmdStruct.program).toEqual(expectedProgram);
        expect(cmdStruct.args).toEqual(['appmap-print-jar-path']);
        const ret = {
          stdout: 'com.appland:appmap-agent.jar.path=appmap.jar',
          stderr: '',
        };
        return Promise.resolve(ret);
      };

      beforeEach(() => {
        fse.copySync(projectFixture, projectDir);
        sinon.stub(inquirer, 'prompt').resolves({
          addMavenCentral: 'Yes',
          result: 'Gradle',
          confirm: true,
        });
      });

      it('installs as expected', async () => {
        expect.assertions(12);
        const evalResults = (err: Error | undefined, argv: any, output: string) => {
          expect(err).toBeNull();

          const actualConfig = fse.readFileSync(path.join(projectDir, 'appmap.yml'), {
            encoding: 'utf-8',
          });
          expect(actualConfig).toEqual(expectedConfig);
        };
        await testE2E(
          verifyJavaVersion,
          verifyAgent,
          printPath,
          initAgent,
          validateAgent,
          evalResults
        );
      });

      it('fails when validation fails', async () => {
        expect.assertions(9);
        const msg = 'failValidate, validation failed';
        const failValidate = () => Promise.reject(new Error(msg));
        const evalResults = (err: Error | undefined, argv: any, output: string) => {
          expect(err?.message).toMatch(msg);
        };

        await testE2E(
          verifyJavaVersion,
          verifyAgent,
          printPath,
          initAgent,
          failValidate,
          evalResults
        );
      });
    });

    describe('managed with maven', () => {
      const projectFixture = path.join(fixtureDir, 'java', 'maven', 'example-project');

      const verifyAgent = (cmdStruct: CommandStruct) => {
        const expectedProgram = process.platform === 'win32' ? '.\\mvnw.cmd' : './mvnw';
        expect(cmdStruct.program).toEqual(expectedProgram);
        expect(cmdStruct.args).toEqual([
          '-Dplugin=com.appland:appmap-maven-plugin',
          'help:describe',
        ]);
        const ret = {
          stdout: '',
          stderr: '',
        };
        return Promise.resolve(ret);
      };

      const printPath = (cmdStruct: CommandStruct) => {
        const expectedProgram = process.platform === 'win32' ? '.\\mvnw.cmd' : './mvnw';
        expect(cmdStruct.program).toEqual(expectedProgram);
        expect(cmdStruct.args).toEqual(['appmap:print-jar-path']);
        const ret = {
          stdout: 'com.appland:appmap-agent.jar.path=appmap.jar',
          stderr: '',
        };
        return Promise.resolve(ret);
      };

      beforeEach(() => {
        fse.copySync(projectFixture, projectDir);
        sinon.stub(inquirer, 'prompt').resolves({ result: 'Maven', confirm: true });
      });

      it('installs as expected', async () => {
        expect.assertions(12);
        const evalResults = (err: Error | undefined, argv: any, output: string) => {
          expect(err).toBeNull();

          const actualConfig = fse.readFileSync(path.join(projectDir, 'appmap.yml'), {
            encoding: 'utf-8',
          });
          expect(actualConfig).toEqual(expectedConfig);
        };
        await testE2E(
          verifyJavaVersion,
          verifyAgent,
          printPath,
          initAgent,
          validateAgent,
          evalResults
        );
      });

      it('fails when validation fails', async () => {
        expect.assertions(9);
        const msg = 'failValidate, validation failed';
        const failValidate = () => Promise.reject(new Error(msg));
        const evalResults = (err: Error | undefined, argv: any, output: string) => {
          expect(err?.message).toMatch(msg);
        };

        await testE2E(
          verifyJavaVersion,
          verifyAgent,
          printPath,
          initAgent,
          failValidate,
          evalResults
        );
      });
    });
  });

  describe('A Ruby project', () => {
    const projectFixture = path.join(fixtureDir, 'ruby', 'app');

    beforeEach(() => {
      fse.copySync(projectFixture, projectDir);
      sinon.stub(inquirer, 'prompt').resolves({ confirm: true });
    });

    const checkCurrentConfig = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('bundle');
      const args = cmdStruct.args;
      expect(args).toEqual(['check', '--dry-run']);
      const ret = { stdout: '', stderr: '' };
      return Promise.resolve(ret);
    };

    const installAgent = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('bundle');
      const args = cmdStruct.args;
      expect(args).toEqual(['install']);
      const ret = { stdout: '', stderr: '' };
      return Promise.resolve(ret);
    };

    const expectedConfig = `
# Fake appmap.yml
name: fake-app
packages:
- path: app/controllers
`;

    const initAgent = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('bundle');
      const args = cmdStruct.args;
      expect(args).toEqual(['exec', 'appmap-agent-init']);
      const fakeConfig = `
{
   "configuration": {
     "contents": "${expectedConfig.replace(/[\n]/g, '\\n')}"
   }
}`;
      const ret = { stdout: fakeConfig, stderr: '' };
      return Promise.resolve(ret);
    };

    const validateAgent = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('bundle');
      const args = cmdStruct.args;
      expect(args).toEqual(['exec', 'appmap-agent-validate']);
      const ret = { stdout: '[]', stderr: '' };
      return Promise.resolve(ret);
    };

    const rubyVersion = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('ruby');
      expect(cmdStruct.args).toEqual(['-v']);
      return Promise.resolve({ stdout: 'ruby 2.5.1p57', stderr: '' });
    };

    const gemHome = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('ruby');
      expect(cmdStruct.args).toEqual(['-v']);
      return Promise.resolve({ stdout: '/usr/local/gems', stderr: '' });
    };

    const checkBundlerConfig = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('bundle');
      expect(cmdStruct.args).toEqual(['config', 'get', 'without']);
      return Promise.resolve({
        stdout:
          'Set for your local app (/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/.bundle/config): [:test]',
        stderr: '',
      });
    };

    const rubyTestE2E = async (
      rubyVersion: (command: CommandStruct) => Promise<CommandReturn>,
      gemHome: (command: CommandStruct) => Promise<CommandReturn>,
      installAgent: (command: CommandStruct) => Promise<CommandReturn>,
      initAgent: (command: CommandStruct) => Promise<CommandReturn>,
      validateAgent: (command: CommandStruct) => Promise<CommandReturn>,
      evalResults: (err: Error | undefined, argv: any, output: string) => void,
      checkCurrentConfig: (command: CommandStruct) => Promise<CommandReturn>,
      checkBundlerConfig: (command: CommandStruct) => Promise<CommandReturn>
    ) => {
      let callIdx = 0;
      sinon
        .stub(commandRunner, 'run')
        .onCall(callIdx++)
        .callsFake(rubyVersion)
        .onCall(callIdx++)
        .callsFake(gemHome)
        .onCall(callIdx++)
        .callsFake(checkCurrentConfig)
        .onCall(callIdx++)
        .callsFake(checkBundlerConfig)
        .onCall(callIdx++)
        .callsFake(installAgent)
        .onCall(callIdx++)
        .callsFake(initAgent)
        .onCall(callIdx++)
        .callsFake(validateAgent);

      return invokeCommand(projectDir, evalResults);
    };

    it('installs as expected', async () => {
      expect.assertions(15);
      const evalResults = (err: Error | undefined, argv: any, output: string) => {
        expect(err).toBeNull();

        const actualConfig = fse.readFileSync(path.join(projectDir, 'appmap.yml'), {
          encoding: 'utf-8',
        });
        expect(actualConfig).toEqual(expectedConfig);
      };
      await rubyTestE2E(
        rubyVersion,
        gemHome,
        installAgent,
        initAgent,
        validateAgent,
        evalResults,
        checkCurrentConfig,
        checkBundlerConfig
      );
    });

    it('fails when validation fails', async () => {
      expect.assertions(12);
      const msg = 'failValidate, validation failed';
      const failValidate = () => {
        return Promise.reject(new Error(msg));
      };
      const evalResults = (err: Error | undefined, argv: any, output: string) => {
        expect(err?.message).toMatch(msg);
      };

      await rubyTestE2E(
        rubyVersion,
        gemHome,
        installAgent,
        initAgent,
        failValidate,
        evalResults,
        checkCurrentConfig,
        checkBundlerConfig
      );
    });

    describe('when validation returns errors', () => {
      const msg = 'failValidate, validation failed';
      const testValidation = async (errorObj: any) => {
        const failValidate = () => {
          return Promise.resolve({ stdout: errorObj, stderr: '' });
        };
        const evalResults = (err: Error | undefined, argv: any, output: string) => {
          expect(err?.message).toMatch(msg);
        };

        await rubyTestE2E(
          rubyVersion,
          gemHome,
          installAgent,
          initAgent,
          failValidate,
          evalResults,
          checkCurrentConfig,
          checkBundlerConfig
        );
      };

      const errorArray = `[{"message": "${msg}"}]`;
      it('fails for old output format', async () => {
        expect.assertions(12);
        await testValidation(errorArray);
      });

      it('fails for new output format', async () => {
        expect.assertions(12);
        const errorObj = `{"errors": ${errorArray}}`;
        await testValidation(errorObj);
      });
    });
  });

  describe('A Python project', () => {
    const pythonVersion = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('python');
      expect(cmdStruct.args).toEqual(['--version']);
      return Promise.resolve({ stdout: 'Python 3.7.0', stderr: '' });
    };

    const pythonPath = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('python');
      expect(cmdStruct.args).toEqual(['-c', "'import sys; print(sys.prefix)'"]);
      return Promise.resolve({ stdout: '/usr/local', stderr: '' });
    };

    const expectedConfig = `
# Fake appmap.yml
name: fake-app
packages:
- path: fake_app
    `;

    describe('managed with pip', () => {
      const projectFixture = path.join(fixtureDir, 'python', 'pip');

      const testE2E = async (
        pythonVersion: (command: CommandStruct) => Promise<CommandReturn>,
        pythonPath: (command: CommandStruct) => Promise<CommandReturn>,
        installAgent: (command: CommandStruct) => Promise<CommandReturn>,
        initAgent: (command: CommandStruct) => Promise<CommandReturn>,
        evalResults: (err: Error | undefined, argv: any, output: string) => void,
        checkCurrentConfig: (command: CommandStruct) => Promise<CommandReturn>,
        pipVersion: (command: CommandStruct) => Promise<CommandReturn>
      ) => {
        let callIdx = 0;
        sinon
          .stub(commandRunner, 'run')
          .onCall(callIdx++)
          .callsFake(pythonVersion)
          .onCall(callIdx++)
          .callsFake(pythonPath)
          .onCall(callIdx++)
          .callsFake(pipVersion)
          .onCall(callIdx++)
          .callsFake(checkCurrentConfig)
          .onCall(callIdx++)
          .callsFake(installAgent)
          .onCall(callIdx++)
          .callsFake(initAgent);

        return invokeCommand(projectDir, evalResults);
      };

      beforeEach(() => {
        fse.copySync(projectFixture, projectDir);
        sinon.stub(inquirer, 'prompt').resolves({ result: 'pip', confirm: true });
      });

      const installAgent = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('pip');
        expect(cmdStruct.args).toEqual(['install', '-r', 'requirements.txt']);
        const ret = { stdout: '', stderr: '' };
        return Promise.resolve(ret);
      };

      const initAgent = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('appmap-agent-init');
        expect(cmdStruct.args.length).toEqual(0);
        const fakeConfig = `
{
  "configuration": {
    "contents": "${expectedConfig.replace(/[\n]/g, '\\n')}"
  }
}`;
        const ret = { stdout: fakeConfig, stderr: '' };
        return Promise.resolve(ret);
      };

      describe('below version 22.2.0', () => {
        const pipVersion = (cmdStruct: CommandStruct) => {
          expect(cmdStruct.program).toEqual('pip');
          expect(cmdStruct.args).toEqual(['--version']);
          return Promise.resolve({
            stdout:
              'pip 22.0 from /home/user/.pyenv/versions/3.7.0/lib/python3.7/site-packages/pip (python 3.7)',
            stderr: '',
          });
        };

        const checkCurrentConfig = (cmdStruct: CommandStruct) => {
          expect(cmdStruct.program).toEqual('pip');
          const args = cmdStruct.args;
          expect(args).toEqual(['install', '-r', 'requirements.txt']);
          const ret = { stdout: '', stderr: '' };
          return Promise.resolve(ret);
        };

        it('installs as expected', async () => {
          expect.assertions(14);
          const evalResults = (err: Error | undefined, argv: any, output: string) => {
            expect(err).toBeNull();

            const actualConfig = fse.readFileSync(path.join(projectDir, 'appmap.yml'), {
              encoding: 'utf-8',
            });
            expect(actualConfig).toEqual(expectedConfig);
          };
          await testE2E(
            pythonVersion,
            pythonPath,
            installAgent,
            initAgent,
            evalResults,
            checkCurrentConfig,
            pipVersion
          );
        });
      });

      describe('above version 22.2.0', () => {
        const pythonVersion = (cmdStruct: CommandStruct) => {
          expect(cmdStruct.program).toEqual('python');
          expect(cmdStruct.args).toEqual(['--version']);
          return Promise.resolve({ stdout: 'Python 3.10.7', stderr: '' });
        };

        const pipVersion = (cmdStruct: CommandStruct) => {
          expect(cmdStruct.program).toEqual('pip');
          expect(cmdStruct.args).toEqual(['--version']);
          return Promise.resolve({
            stdout:
              'pip 22.2.2 from /home/user/.pyenv/versions/3.10.7/lib/python3.7/site-packages/pip (python 3.10)',
            stderr: '',
          });
        };

        const checkCurrentConfig = (cmdStruct: CommandStruct) => {
          expect(cmdStruct.program).toEqual('pip');
          const args = cmdStruct.args;
          expect(args).toEqual(['install', '-r', 'requirements.txt', '--dry-run']);
          const ret = { stdout: '', stderr: '' };
          return Promise.resolve(ret);
        };

        it('installs as expected', async () => {
          expect.assertions(14);
          const evalResults = (err: Error | undefined, argv: any, output: string) => {
            expect(err).toBeNull();

            const actualConfig = fse.readFileSync(path.join(projectDir, 'appmap.yml'), {
              encoding: 'utf-8',
            });
            expect(actualConfig).toEqual(expectedConfig);
          };
          await testE2E(
            pythonVersion,
            pythonPath,
            installAgent,
            initAgent,
            evalResults,
            checkCurrentConfig,
            pipVersion
          );
        });
      });
    });

    describe('managed with poetry', () => {
      const projectFixture = path.join(fixtureDir, 'python', 'poetry');

      const testE2E = async (
        pythonVersion: (command: CommandStruct) => Promise<CommandReturn>,
        pythonPath: (command: CommandStruct) => Promise<CommandReturn>,
        installAgent: (command: CommandStruct) => Promise<CommandReturn>,
        initAgent: (command: CommandStruct) => Promise<CommandReturn>,
        evalResults: (err: Error | undefined, argv: any, output: string) => void,
        checkCurrentConfig: (command: CommandStruct) => Promise<CommandReturn>
      ) => {
        let callIdx = 0;
        sinon
          .stub(commandRunner, 'run')
          .onCall(callIdx++)
          .callsFake(pythonVersion)
          .onCall(callIdx++)
          .callsFake(pythonPath)
          .onCall(callIdx++)
          .callsFake(checkCurrentConfig)
          .onCall(callIdx++)
          .callsFake(installAgent)
          .onCall(callIdx++)
          .callsFake(initAgent);

        return invokeCommand(projectDir, evalResults);
      };

      const pythonVersion = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('python');
        expect(cmdStruct.args).toEqual(['--version']);
        return Promise.resolve({ stdout: 'Python 3.7.0', stderr: '' });
      };

      beforeEach(() => {
        fse.copySync(projectFixture, projectDir);
        sinon.stub(inquirer, 'prompt').resolves({ result: 'poetry', confirm: true });
      });

      const checkCurrentConfig = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('poetry');
        const args = cmdStruct.args;
        expect(args).toEqual(['install', '--dry-run']);
        const ret = { stdout: '', stderr: '' };
        return Promise.resolve(ret);
      };

      const installAgent = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('poetry');
        expect(cmdStruct.args).toEqual(['add', '--dev', '--allow-prereleases', 'appmap']);
        const ret = { stdout: '', stderr: '' };
        return Promise.resolve(ret);
      };

      const initAgent = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('poetry');
        expect(cmdStruct.args).toEqual(['run', 'appmap-agent-init']);
        const fakeConfig = `
{
   "configuration": {
     "contents": "${expectedConfig.replace(/[\n]/g, '\\n')}"
   }
}`;
        const ret = { stdout: fakeConfig, stderr: '' };
        return Promise.resolve(ret);
      };

      it('installs as expected', async () => {
        expect.assertions(12);
        const evalResults = (err: Error | undefined, argv: any, output: string) => {
          expect(err).toBeNull();

          const actualConfig = fse.readFileSync(path.join(projectDir, 'appmap.yml'), {
            encoding: 'utf-8',
          });
          expect(actualConfig).toEqual(expectedConfig);
        };
        await testE2E(
          pythonVersion,
          pythonPath,
          installAgent,
          initAgent,
          evalResults,
          checkCurrentConfig
        );
      });
    });
  });

  describe('A JavaScript project', () => {
    const jsTestE2E = async (
      nodeVersion: (command: CommandStruct) => Promise<CommandReturn>,
      installAgent: (command: CommandStruct) => Promise<CommandReturn>,
      initAgent: (command: CommandStruct) => Promise<CommandReturn>,
      validateAgent: (command: CommandStruct) => Promise<CommandReturn>,
      evalResults: (err: Error | undefined, argv: any, output: string) => void,
      checkCurrentConfig: (command: CommandStruct) => Promise<CommandReturn>
    ) => {
      let callIdx = 0;
      sinon
        .stub(commandRunner, 'run')
        .onCall(callIdx++)
        .callsFake(nodeVersion)
        .onCall(callIdx++)
        .callsFake(checkCurrentConfig)
        .onCall(callIdx++)
        .callsFake(installAgent)
        .onCall(callIdx++)
        .callsFake(initAgent)
        .onCall(callIdx++)
        .callsFake(validateAgent)
        .onCall(callIdx++);

      return invokeCommand(projectDir, evalResults);
    };

    const nodeVersion = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('node');
      expect(cmdStruct.args).toEqual(['--version']);
      return Promise.resolve({ stdout: 'v16.11.1', stderr: '' });
    };
    const expectedConfig = `
    # Fake appmap.yml
    name: fake-app
    packages:
    - path: lib
    `;

    const initAgent = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('npx');
      const args = cmdStruct.args;
      expect(args).toEqual(['@appland/appmap-agent-js', 'init', projectDir]);
      const fakeConfig = `
    {
       "configuration": {
         "contents": "${expectedConfig.replace(/[\n]/g, '\\n')}"
       }
    }`;
      const ret = { stdout: fakeConfig, stderr: '' };
      return Promise.resolve(ret);
    };

    const validateAgent = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('npx');
      const args = cmdStruct.args;
      expect(args).toEqual(['@appland/appmap-agent-js', 'status', projectDir]);
      const ret = { stdout: '[]', stderr: '' };
      return Promise.resolve(ret);
    };

    describe('managed with npm', () => {
      const projectFixture = path.join(fixtureDir, 'javascript', 'npm');

      beforeEach(() => {
        fse.copySync(projectFixture, projectDir);
        sinon.stub(inquirer, 'prompt').resolves({ result: 'npm', confirm: true });
      });

      const checkCurrentConfig = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('npm');
        const args = cmdStruct.args;
        expect(args).toEqual(['install', '--dry-run']);
        const ret = { stdout: '', stderr: '' };
        return Promise.resolve(ret);
      };

      const installAgent = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('npm');
        expect(cmdStruct.args).toEqual(['install', '--saveDev', '@appland/appmap-agent-js@latest']);
        const ret = { stdout: '', stderr: '' };
        return Promise.resolve(ret);
      };

      it('installs as expected', async () => {
        expect.assertions(12);
        const evalResults = (err: Error | undefined, argv: any, output: string) => {
          expect(err).toBeNull();

          const actualConfig = fse.readFileSync(path.join(projectDir, 'appmap.yml'), {
            encoding: 'utf-8',
          });
          expect(actualConfig).toEqual(expectedConfig);
        };

        await jsTestE2E(
          nodeVersion,
          installAgent,
          initAgent,
          validateAgent,
          evalResults,
          checkCurrentConfig
        );
      });

      it('fails when validation fails', async () => {
        expect.assertions(9);
        const msg = 'failValidate, validation failed';
        const failValidate = () => Promise.reject(new Error(msg));
        const evalResults = (err: Error | undefined, argv: any, output: string) => {
          expect(err?.message).toMatch(msg);
        };
        await jsTestE2E(
          nodeVersion,
          installAgent,
          initAgent,
          failValidate,
          evalResults,
          checkCurrentConfig
        );
      });
    });
    describe('managed with yarn', () => {
      const projectFixture = path.join(fixtureDir, 'javascript', 'yarn');

      beforeEach(() => {
        fse.copySync(projectFixture, projectDir);
        sinon.stub(inquirer, 'prompt').resolves({ result: 'yarn', confirm: true });
      });

      const checkCurrentConfig = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('yarn');
        const args = cmdStruct.args;
        expect(args).toEqual(['install', '--immutable']);
        const ret = { stdout: '', stderr: '' };
        return Promise.resolve(ret);
      };

      const installAgent = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('yarn');
        expect(cmdStruct.args).toEqual(['add', '--dev', '@appland/appmap-agent-js@latest']);
        const ret = { stdout: '', stderr: '' };
        return Promise.resolve(ret);
      };

      it('installs as expected', async () => {
        expect.assertions(12);
        const evalResults = (err: Error | undefined, argv: any, output: string) => {
          expect(err).toBeNull();

          const actualConfig = fse.readFileSync(path.join(projectDir, 'appmap.yml'), {
            encoding: 'utf-8',
          });
          expect(actualConfig).toEqual(expectedConfig);
        };

        await jsTestE2E(
          nodeVersion,
          installAgent,
          initAgent,
          validateAgent,
          evalResults,
          checkCurrentConfig
        );
      });

      it('fails when validation fails', async () => {
        expect.assertions(9);
        const msg = 'failValidate, validation failed';
        const failValidate = () => Promise.reject(new Error(msg));
        const evalResults = (err: Error | undefined, argv: any, output: string) => {
          expect(err?.message).toMatch(msg);
        };
        await jsTestE2E(
          nodeVersion,
          installAgent,
          initAgent,
          failValidate,
          evalResults,
          checkCurrentConfig
        );
      });
    });
  });
  describe('Varied project configurations', () => {
    beforeEach(() => {
      sinon.stub(commandRunner, 'run').resolves({ stdout: '', stderr: '' });
    });

    it('requests the user to select a project type if more than one exist', async () => {
      expect.assertions(2);
      const projectFixture = path.join(fixtureDir, 'python', 'mixed');
      await fse.copy(projectFixture, projectDir);

      const promptStub = sinon.stub(UI, 'prompt').resolves({ installer0: 'poetry', confirm: true });

      const installAgentStub = sinon.stub(PoetryInstaller.prototype, 'installAgent').resolves();

      await invokeCommand(projectDir, () => {});

      const firstPrompt = promptStub.getCall(0).args[0] as inquirer.Question;
      expect(firstPrompt.name).toEqual('installer0');
      expect(installAgentStub).toBeCalled();
    });

    it('fails if no supported project is found', async () => {
      expect.assertions(5);
      const installProcedureStub = sinon
        .stub(AgentInstallerProcedure.prototype, 'run')
        .callThrough();

      await invokeCommand(projectDir, (err) => {
        expect(err?.message).toMatch('No supported project was found');
      });

      expect(installProcedureStub).not.toBeCalled();
      const sendEventStub = Telemetry.sendEvent as sinon.SinonStub;
      expect(sendEventStub).toBeCalledTwice();
      expect(sendEventStub.getCall(0)).toBeCalledWithMatch({
        name: 'install-agent:start',
      });
      expect(sendEventStub.getCall(1)).toBeCalledWithMatch({
        name: 'install-agent:soft_failure',
      });
    });

    describe('ticket handling', () => {
      let runStub: sinon.SinonStub;

      beforeEach(async () => {
        const projectFixture = path.join(fixtureDir, 'python', 'mixed');
        await fse.copy(projectFixture, projectDir);

        sinon.stub(UI, 'prompt').resolves({ installer0: 'poetry', confirm: true });

        runStub = sinon.stub(AgentInstallerProcedure.prototype, 'run');
      });

      it('opens a ticket on failure', async () => {
        expect.assertions(2);

        runStub.throws(new Error('install failed'));
        await invokeCommand(projectDir, () => {});
        expect(runStub).toBeCalledOnce();

        expect(openTicketStub).toBeCalledOnce();
      });

      it("doesn't open a ticket on success", async () => {
        expect.assertions(2);

        runStub.resolves();
        await invokeCommand(projectDir, () => {});
        expect(runStub).toBeCalledOnce();

        expect(openTicketStub).not.toBeCalled();
      });
    });
  });

  describe('when appmap-agent-validate returns a schema', () => {
    beforeEach(() => {
      const installer = new BundleInstaller('.');

      sinon.stub(ProjectConfiguration, 'getProjects').resolves([
        {
          path: projectDir,
          name: 'test',
          availableInstallers: [installer],
          selectedInstaller: installer,
        },
      ]);

      sinon.stub(installer, 'environment').resolves({});

      sinon.stub(inquirer, 'prompt').resolves({
        installerName: 'ruby',
        confirm: true,
        overwriteAppMapYml: 'Use existing',
      });

      sinon.stub(BundleInstaller.prototype, 'checkCurrentConfig').resolves();
      sinon.stub(BundleInstaller.prototype, 'installAgent').resolves();

      sinon.stub(AgentInstallerProcedure.prototype, 'configExists').value(true);
      sinon.stub(AgentInstallerProcedure.prototype, 'loadConfig').returns({});

      sinon
        .stub(AgentInstallerProcedure.prototype, 'validateAgent')
        .resolves({ stdout: '{"errors": [], "schema": "{}"}', stderr: '' });
    });

    it('succeeds when the config syntax is valid', async () => {
      expect.assertions(1);
      const validateConfig = sinon.stub(validator, 'validateConfig').returns({ valid: true });
      await invokeCommand(projectDir, () => {});

      expect(validateConfig).toBeCalled();
    });

    it('fails when the config syntax is invalid', async () => {
      expect.assertions(2);
      const jsError = [
        {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 1, offset: 0 },
          error: 'syntax error',
          dataPath: '/path/1',
          path: '/path/1',
        },
      ];

      const validationResult = {
        valid: false,
        errors: {
          cli: `line1
          line2
          syntax error
          line4`,
          js: jsError,
        },
      };
      const validateConfig = sinon.stub(validator, 'validateConfig').returns(validationResult);

      const installProcedureStub = sinon
        .stub(AgentInstallerProcedure.prototype, 'run')
        .callThrough();

      await invokeCommand(projectDir, () => {});

      const { returnValue } = installProcedureStub.getCall(0);
      await expect(returnValue).rejects.toBeInstanceOf(ValidationError);
      await returnValue.catch((err) => {
        expect(err.message).toMatch('syntax error');
      });
    });
  });

  describe('when appmap-agent-validate returns an invalid schema', () => {
    it('does not crash when the config syntax is invalid', async () => {
      // all this is mostly the same as beforeEach of 'returns a schema'
      const installer = new BundleInstaller('.');

      sinon.stub(ProjectConfiguration, 'getProjects').resolves([
        {
          path: projectDir,
          name: 'test',
          availableInstallers: [installer],
          selectedInstaller: installer,
        },
      ]);

      sinon.stub(installer, 'environment').resolves({});

      sinon.stub(inquirer, 'prompt').resolves({
        installerName: 'ruby',
        confirm: true,
        overwriteAppMapYml: 'Use existing',
      });

      sinon.stub(BundleInstaller.prototype, 'checkCurrentConfig').resolves();
      sinon.stub(BundleInstaller.prototype, 'installAgent').resolves();

      sinon.stub(AgentInstallerProcedure.prototype, 'configExists').value(true);
      sinon.stub(AgentInstallerProcedure.prototype, 'loadConfig').returns({});

      // NOTE: stdout produced invalid JSON
      sinon
        .stub(AgentInstallerProcedure.prototype, 'validateAgent')
        .resolves({ stdout: '[ }', stderr: '' });

      const uiError = sinon
        .stub(UI, 'error')
        .withArgs('Failed to validate the installation.')
        .resolves();

      const validateConfig = sinon.stub(validator, 'validateConfig').returns({ valid: true });

      await invokeCommand(projectDir, () => {});
      expect(uiError).toBeCalled();
    });
  });

  describe('Multi-project install flow', () => {
    let expectedStubs: SinonStub[];

    beforeEach(() => {
      sinon.stub(commandRunner, 'run').resolves({
        stdout: '{"configuration": { "contents": "" }, "errors": []}',
        stderr: '',
      });

      expectedStubs = [GradleInstaller.prototype, MavenInstaller.prototype].flatMap((prototype) => [
        sinon.stub(prototype, 'environment').resolves(),
        sinon.stub(prototype, 'installAgent').resolves(),
        sinon.stub(prototype, 'initCommand').resolves(),
        sinon.stub(prototype, 'verifyCommand').resolves(),
        sinon.stub(prototype, 'validateAgentCommand').resolves(),
      ]);
    });

    it('installs as expected', async () => {
      expect.assertions(17);
      const projectFixture = path.join(fixtureDir, 'java', 'multi-project');
      fse.copySync(projectFixture, projectDir);

      const promptStub = sinon.stub(inquirer, 'prompt').resolves({
        addSubprojects: true,
        confirm: true,
        selectedSubprojects: ['project-a', 'project-b'],
      });

      await invokeCommand(projectDir, (err) => {
        expect(err).toBeNull();
      });

      // No root project, should default to choosing subproject
      expect(promptStub.getCall(0).args).toMatchObject([
        {
          type: 'confirm',
          message: expect.stringMatching('This directory contains sub-projects'),
          default: true,
        },
      ]);

      expectedStubs.forEach((stub) => expect(stub.called).toBe(true));
      const sendEventStub = Telemetry.sendEvent as sinon.SinonStub;
      expect(sendEventStub).toBeCalledTimes(3);
      expect(sendEventStub.getCall(0)).toBeCalledWithMatch({
        name: 'install-agent:start',
      });
      expect(sendEventStub.getCall(1)).toBeCalledWithMatch({
        name: 'install-agent:success',
        properties: { installer: 'Maven' },
      });
      expect(sendEventStub.getCall(2)).toBeCalledWithMatch({
        name: 'install-agent:success',
        properties: { installer: 'Gradle' },
      });

      expect(openTicketStub).not.toBeCalled();
    });

    it('installs the root project by default', async () => {
      expect.assertions(2);
      const projectFixture = path.join(fixtureDir, 'java', 'multi-project-root');
      fse.copySync(projectFixture, projectDir);
      const promptStub = sinon.stub(inquirer, 'prompt').resolves({
        addSubprojects: true,
        confirm: true,
        selectedSubprojects: ['project-a', 'project-b'],
      });

      await invokeCommand(projectDir, (err) => {
        expect(err).toBeNull();
      });

      // Root project exists, should default to not choosing a sub-project.
      expect(promptStub.getCall(0).args).toMatchObject([
        {
          type: 'confirm',
          message: expect.stringMatching('This directory contains sub-projects'),
          default: false,
        },
      ]);
    });
  });
});
