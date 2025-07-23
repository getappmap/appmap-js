import path from 'path';
import fse from 'fs-extra';
import tmp from 'tmp';
import sinon, { SinonStub } from 'sinon';
import inquirer from 'inquirer';
import { Telemetry } from '@appland/telemetry';
import yargs from 'yargs';
import { existsSync } from 'fs';

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
import { dump } from 'js-yaml';

import * as openTicket from '../../../src/lib/ticket/openTicket';
import { withStubbedTelemetry } from '../../helper';
import assert from 'node:assert';

const fixtureDir = path.join(__dirname, '..', 'fixtures');
tmp.setGracefulCleanup();

const invokeCommand = (
  projectDir: string,
  evalResults: (err: Error | undefined, argv: any, output: string) => void = (err) => {
    if (err) throw err;
  }
) => {
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  const debugSwitch: string = ''; // to debug, set debugSwitch to -v

  if (debugSwitch !== '-v') {
    // Don't scribble on the console unless we're debugging.
    sinon.stub(UI, 'status').set(() => {});
  }

  return new Promise((resolve, reject) =>
    yargs
      .command(require('../../../src/cmds/agentInstaller/install-agent').default)
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Run with verbose logging',
      })
      .parse(`install-agent ${debugSwitch} -d ${projectDir}`, {}, (err, argv, output) => {
        try {
          resolve(evalResults(err, argv, output));
        } catch (err) {
          reject(err);
        }
      })
  );
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

    const providedConfig = `name: fake-app
packages:
  - path: com.fake.Fake
    `;

    const expectedMavenConfig = `name: fake-app
packages:
  - path: com.fake.Fake
language: java
appmap_dir: tmp/appmap
`;

    const expectedGradleConfig = `name: fake-app
packages:
  - path: com.fake.Fake
language: java
appmap_dir: tmp/appmap
`;

    const initAgent = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('java');
      const args = cmdStruct.args;
      expect(args).toEqual(['-jar', 'appmap.jar', '-d', projectDir, 'init']);
      const fakeConfig = `
    {
       "configuration": {
         "contents": "${providedConfig.replace(/[\n]/g, '\\n')}"
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
          expect(actualConfig).toEqual(expectedGradleConfig);
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
          expect(actualConfig).toEqual(expectedMavenConfig);
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

    const providedConfig = `name: fake-app
packages:
  - path: app/controllers
`;

    const expectedConfig = `name: fake-app
packages:
  - path: app/controllers
language: ruby
appmap_dir: tmp/appmap
`;

    const initAgent = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('bundle');
      const args = cmdStruct.args;
      expect(args).toEqual(['exec', 'appmap-agent-init']);
      const fakeConfig = `
{
   "configuration": {
     "contents": "${providedConfig.replace(/[\n]/g, '\\n')}"
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
      expect(cmdStruct.program).toEqual('python3');
      expect(cmdStruct.args).toEqual(['--version']);
      return Promise.resolve({ stdout: 'Python 3.7.0', stderr: '' });
    };

    const pythonPath = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('python3');
      expect(cmdStruct.args).toEqual(['-c', "'import sys; print(sys.prefix)'"]);
      return Promise.resolve({ stdout: '/usr/local', stderr: '' });
    };

    const providedConfig = `name: fake-app
packages:
  - path: fake_app
`;

    const expectedConfig = `name: fake-app
packages:
  - path: fake_app
language: python
appmap_dir: tmp/appmap
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
        sinon
          .stub(inquirer, 'prompt')
          .onCall(0)
          .resolves({ result: 'pip', confirm: true })
          // call 1 comes from checkConfigCommand
          .onCall(1)
          .resolves({ buildFile: 'requirements.txt' });
      });

      const installAgent = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('python3');
        expect(cmdStruct.args).toEqual(['-m', 'pip', 'install', '-r', 'requirements.txt']);
        const ret = { stdout: '', stderr: '' };
        return Promise.resolve(ret);
      };

      const initAgent = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('python3');
        expect(cmdStruct.args).toEqual(['-m', 'appmap.command.appmap_agent_init']);
        const fakeConfig = `
{
   "configuration": {
     "contents": "${providedConfig.replace(/[\n]/g, '\\n')}"
   }
}`;
        const ret = { stdout: fakeConfig, stderr: '' };
        return Promise.resolve(ret);
      };

      describe('below version 22.2.0', () => {
        const pipVersion = (cmdStruct: CommandStruct) => {
          expect(cmdStruct.program).toEqual('python3');
          expect(cmdStruct.args).toEqual(['-m', 'pip', '--version']);
          return Promise.resolve({
            stdout:
              'pip 22.0 from /home/user/.pyenv/versions/3.7.0/lib/python3.7/site-packages/pip (python 3.7)',
            stderr: '',
          });
        };

        const checkCurrentConfig = (cmdStruct: CommandStruct) => {
          expect(cmdStruct.program).toEqual('python3');
          const args = cmdStruct.args;
          expect(args).toEqual(['-m', 'pip', 'install', '-r', 'requirements.txt']);
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
          expect(cmdStruct.program).toEqual('python3');
          expect(cmdStruct.args).toEqual(['--version']);
          return Promise.resolve({ stdout: 'Python 3.10.7', stderr: '' });
        };

        const pipVersion = (cmdStruct: CommandStruct) => {
          expect(cmdStruct.program).toEqual('python3');
          expect(cmdStruct.args).toEqual(['-m', 'pip', '--version']);
          return Promise.resolve({
            stdout:
              'pip 22.2.2 from /home/user/.pyenv/versions/3.10.7/lib/python3.7/site-packages/pip (python 3.10)',
            stderr: '',
          });
        };

        const checkCurrentConfig = (cmdStruct: CommandStruct) => {
          expect(cmdStruct.program).toEqual('python3');
          const args = cmdStruct.args;
          expect(args).toEqual(['-m', 'pip', 'install', '-r', 'requirements.txt', '--dry-run']);
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
        expect(cmdStruct.program).toEqual('python3');
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
    const docUrl = 'https://appmap.io/docs/reference/appmap-node';

    it('tells the user there is no need for installation', async () => {
      fse.writeFileSync(path.join(projectDir, 'package.json'), '{}');

      const log = jest.spyOn(console, 'log');
      await invokeCommand(projectDir);

      const output = log.mock.calls.map(([x]) => x).join('\n');
      expect(output).toContain('No AppMap installation needed');
      expect(output).toContain(docUrl);
    });

    it("doesn't bother the user to select subprojects", async () => {
      fse.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fse.mkdirSync(path.join(projectDir, 'sub1'));
      fse.mkdirSync(path.join(projectDir, 'sub2'));
      fse.writeFileSync(path.join(projectDir, 'sub1', 'package.json'), '{}');
      fse.writeFileSync(path.join(projectDir, 'sub2', 'package.json'), '{}');

      const prompt = jest
        .spyOn(UI, 'prompt')
        .mockImplementation(() => Promise.reject(new Error('unexpected prompt')));
      const log = jest.spyOn(console, 'log');
      await invokeCommand(projectDir);

      expect(prompt).not.toHaveBeenCalled();

      // make sure we only print the message once
      const output = log.mock.calls.map(([x]) => x).join('\n');
      // count occurences of docUrl in the output
      const count = output.split(docUrl).length - 1;
      expect(count).toEqual(1);
    });
  });

  describe('Varied project configurations', () => {
    beforeEach(() => {
      sinon.stub(commandRunner, 'run').resolves({ stdout: '', stderr: '' });
    });

    it("tells the user if the target directory doesn't exist", async () => {
      expect.assertions(6);

      const badDirectory = '/tmp/does-not-exist';
      expect(existsSync(badDirectory)).toBeFalsy(); // sanity check

      const error = sinon.stub(console, 'error');
      const installProcedureStub = sinon
        .stub(AgentInstallerProcedure.prototype, 'run')
        .callThrough();

      await invokeCommand(badDirectory, (err) => {
        expect(err?.message).toMatch(badDirectory);
      });

      expect(error).toBeCalledOnce();
      const errorCalls = error.getCalls();
      expect(errorCalls[0].firstArg).toMatch('does not exist or is not a directory');

      expect(installProcedureStub).not.toBeCalled();
      const sendEventStub = Telemetry.sendEvent as sinon.SinonStub;
      expect(sendEventStub).toBeCalledTimes(0);
    });

    it('requests the user to select a project type if more than one exist', async () => {
      expect.assertions(2);
      const projectFixture = path.join(fixtureDir, 'python', 'mixed');
      await fse.copy(projectFixture, projectDir);

      const promptStub = sinon.stub(UI, 'prompt').resolves({ installer0: 'poetry', confirm: true });

      const installAgentStub = sinon.stub(PoetryInstaller.prototype, 'installAgent').resolves();

      await invokeCommand(projectDir, () => {});

      const firstPrompt = promptStub.getCall(0).args[0];
      assert('name' in firstPrompt);
      expect(firstPrompt.name).toEqual('installer0');
      expect(installAgentStub).toBeCalled();
    });

    it('fails if no supported project is found', async () => {
      expect.assertions(3);
      const installProcedureStub = sinon
        .stub(AgentInstallerProcedure.prototype, 'run')
        .callThrough();

      await invokeCommand(projectDir, (err) => {
        expect(err?.message).toMatch('No supported project was found');
      });

      expect(installProcedureStub).not.toBeCalled();
      const sendEventStub = Telemetry.sendEvent as sinon.SinonStub;
      expect(sendEventStub).toBeCalledTimes(0);
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
      sinon.stub(commandRunner, 'run').resolves({
        stdout: '{"configuration": { "contents": "{}" }, "errors": []}',
        stderr: '',
      });

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

    it('merges language and appmap_dir into existing config', async () => {
      expect.assertions(2);
      const validateConfig = sinon.stub(validator, 'validateConfig').returns({ valid: true });
      await invokeCommand(projectDir, () => {});

      expect(validateConfig).toBeCalled();
      const actualConfig = fse.readFileSync(path.join(projectDir, 'appmap.yml'), {
        encoding: 'utf-8',
      });
      expect(actualConfig).toEqual(dump({ language: 'ruby', appmap_dir: 'tmp/appmap' }));
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
      sinon.stub(validator, 'validateConfig').returns(validationResult);

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

      const validateConfig = sinon.stub(validator, 'validateConfig').returns({ valid: true });

      await invokeCommand(projectDir, (err) => {
        expect(err?.message).toMatch('Error');
      });
    });
  });

  describe('Multi-project install flow', () => {
    let expectedStubs: SinonStub<any>[];

    beforeEach(() => {
      sinon.stub(commandRunner, 'run').resolves({
        stdout: '{"configuration": { "contents": "" }, "errors": []}',
        stderr: '',
      });

      expectedStubs = [GradleInstaller.prototype, MavenInstaller.prototype].flatMap((prototype) => [
        sinon.stub(prototype, 'environment').resolves(),
        sinon.stub(prototype, 'installAgent').resolves(),
        sinon
          .stub(prototype, 'initCommand')
          .resolves({ args: [], environment: {}, path: '', program: '' }),
        sinon.stub(prototype, 'verifyCommand').resolves(),
        sinon.stub(prototype, 'validateAgentCommand').resolves(),
      ]);
    });

    it('installs as expected', async () => {
      expect.assertions(14);
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
      expect(sendEventStub).toBeCalledTimes(0);

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
