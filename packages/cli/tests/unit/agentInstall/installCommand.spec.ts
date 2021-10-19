import path from 'path';
import fse from 'fs-extra';
import tmp from 'tmp';
import sinon from 'sinon';
import inquirer from 'inquirer';
import Telemetry from '../../../src/telemetry';
import yargs from 'yargs';

import { PoetryInstaller } from '../../../src/cmds/agentInstaller/pythonAgentInstaller';
import { BundleInstaller } from '../../../src/cmds/agentInstaller/rubyAgentInstaller';
import AgentInstallerProcedure from '../../../src/cmds/agentInstaller/agentInstallerProcedure';
import * as commandRunner from '../../../src/cmds/agentInstaller/commandRunner';
import CommandStruct, {
  CommandReturn,
} from '../../../src/cmds/agentInstaller/commandStruct';

import UI from '../../../src/cmds/userInteraction';
import { InstallError, ValidationError } from '../../../src/cmds/errors';

import * as validator from '../../../src/service/config/validator';

import 'jest-sinon';

const fixtureDir = path.join(__dirname, '..', 'fixtures');
tmp.setGracefulCleanup();

const invokeCommand = (
  projectDir: string,
  evalResults: (err: Error | undefined, argv: any, output: string) => void,
  ) => {
    const debugSwitch: string = ''; // to debug, set debugSwitch to -v

  if (debugSwitch !== '-v') {
    // Don't scribble on the console unless we're debugging.
    sinon.stub(console, 'log');
    sinon.stub(console, 'warn');
    sinon.stub(console, 'error');
    sinon.stub(UI, 'status').set(() => {});
  }

  return yargs
    .command(require('../../../src/cmds/agentInstaller/install-agent').default)
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging',
    })
    .parse(
      `install-agent ${debugSwitch} ${projectDir}`,
      {},
      (err, argv, output) => {
        evalResults(err, argv, output);
      }
    );
};

describe('install sub-command', () => {
  let projectDir: string;
  beforeEach(() => {
    sinon.stub(Telemetry);
    projectDir = tmp.dirSync({} as any).name;
  });

  afterEach(() => {
    // This bug https://github.com/sinonjs/sinon/issues/2384 acknowledges that
    // sinon.restore doesn't restore static methods. It suggests
    // sinon.restoreObject as a workaround, but restoreObject is currently
    // missing from @types/sinon.
    //
    // This hacks around both problems:
    sinon['restoreObject'](Telemetry);
    sinon.restore();
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
    - com.fake.Fake
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
      expect(args).toEqual([
        '-jar',
        'appmap.jar',
        '-d',
        projectDir,
        'validate',
      ]);
      const ret = { stdout: '[]', stderr: '' };
      return Promise.resolve(ret);
    };

    const verifyJavaVersion = (cmdStruct: CommandStruct) => {
      expect(cmdStruct.program).toEqual('javac');
      expect(cmdStruct.args).toEqual(['-version']);
      return Promise.resolve({ stdout: '11.0.11', stderr: '' });
    };

    describe('managed with gradle', () => {
      const projectFixture = path.join(
        fixtureDir,
        'java',
        'gradle',
        'example-project'
      );

      const verifyAgent = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('./gradlew');
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
        expect(cmdStruct.program).toEqual('./gradlew');
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
        const evalResults = async (err, argv, output) => {
          expect(err).toBeNull();

          const actualConfig = await fse.readFile(
            path.join(projectDir, 'appmap.yml'),
            { encoding: 'utf-8' }
          );
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
        const msg = 'failValidate, validation failed';
        const failValidate = () => Promise.reject(new Error(msg));
        const evalResults = (err, argv, output) => {
          expect(err.message).toEqual(msg);
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
      const projectFixture = path.join(
        fixtureDir,
        'java',
        'maven',
        'example-project'
      );

      const verifyAgent = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('./mvnw');
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
        expect(cmdStruct.program).toEqual('./mvnw');
        expect(cmdStruct.args).toEqual(['appmap:print-jar-path']);
        const ret = {
          stdout: 'com.appland:appmap-agent.jar.path=appmap.jar',
          stderr: '',
        };
        return Promise.resolve(ret);
      };

      beforeEach(() => {
        fse.copySync(projectFixture, projectDir);
        sinon
          .stub(inquirer, 'prompt')
          .resolves({ result: 'Maven', confirm: true });
      });

      it('installs as expected', async () => {
        const evalResults = async (err, argv, output) => {
          expect(err).toBeNull();

          const actualConfig = await fse.readFile(
            path.join(projectDir, 'appmap.yml'),
            { encoding: 'utf-8' }
          );
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
        const msg = 'failValidate, validation failed';
        const failValidate = () => Promise.reject(new Error(msg));
        const evalResults = (err, argv, output) => {
          expect(err.message).toEqual(msg);
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
- app/controllers
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

    const rubyTestE2E = async (
      rubyVersion: (command: CommandStruct) => Promise<CommandReturn>,
      gemHome: (command: CommandStruct) => Promise<CommandReturn>,
      installAgent: (command: CommandStruct) => Promise<CommandReturn>,
      initAgent: (command: CommandStruct) => Promise<CommandReturn>,
      validateAgent: (command: CommandStruct) => Promise<CommandReturn>,
      evalResults: (err: Error | undefined, argv: any, output: string) => void
    ) => {
      let callIdx = 0;
      sinon
        .stub(commandRunner, 'run')
        .onCall(callIdx++)
        .callsFake(rubyVersion)
        .onCall(callIdx++)
        .callsFake(gemHome)
        .onCall(callIdx++)
        .callsFake(installAgent)
        .onCall(callIdx++)
        .callsFake(initAgent)
        .onCall(callIdx++)
        .callsFake(validateAgent);

      return invokeCommand(projectDir, evalResults);
    };

    it('installs as expected', async () => {
      const evalResults = async (err, argv, output) => {
        expect(err).toBeNull();

        const actualConfig = await fse.readFile(
          path.join(projectDir, 'appmap.yml'),
          { encoding: 'utf-8' }
        );
        expect(actualConfig).toEqual(expectedConfig);
      };
      await rubyTestE2E(
        rubyVersion,
        gemHome,
        installAgent,
        initAgent,
        validateAgent,
        evalResults
      );
    });

    it('fails when validation fails', async () => {
      const msg = 'failValidate, validation failed';
      const failValidate = () => {
        return Promise.reject(new Error(msg));
      };
      const evalResults = (err, argv, output) => {
        expect(err.message).toEqual(msg);
      };

      await rubyTestE2E(
        rubyVersion,
        gemHome,
        installAgent,
        initAgent,
        failValidate,
        evalResults
      );
    });

    describe('when validation returns errors', () => {
      const msg = 'failValidate, validation failed';
      const testValidation = async (errorObj) => {
      const failValidate = () => {
        return Promise.resolve({stdout: errorObj , stderr: ''});
      };
      const evalResults = (err, argv, output) => {
        expect(err.message).toEqual(msg);
      };

      await rubyTestE2E(
        rubyVersion,
        gemHome,
        installAgent,
        initAgent,
        failValidate,
        evalResults
      );
      }

      const errorArray = `[{"message": "${msg}"}]`;
      it('fails for old output format', async () => {
        await testValidation(errorArray);
      });

      it('fails for new output format', async () => {
        const errorObj = `{"errors": ${errorArray}}`;
        await testValidation(errorObj);
      });
    });


  });

  describe('A Python project', () => {
    const testE2E = async (
      pythonVersion: (command: CommandStruct) => Promise<CommandReturn>,
      pythonPath: (command: CommandStruct) => Promise<CommandReturn>,
      installAgent: (command: CommandStruct) => Promise<CommandReturn>,
      initAgent: (command: CommandStruct) => Promise<CommandReturn>,
      evalResults: (err: Error | undefined, argv: any, output: string) => void
    ) => {
      let callIdx = 0;
      sinon
        .stub(commandRunner, 'run')
        .onCall(callIdx++)
        .callsFake(pythonVersion)
        .onCall(callIdx++)
        .callsFake(pythonPath)
        .onCall(callIdx++)
        .callsFake(installAgent)
        .onCall(callIdx++)
        .callsFake(initAgent);

      return invokeCommand(projectDir, evalResults);
    };

    const expectedConfig = `
# Fake appmap.yml
name: fake-app
packages:
- fake_app
    `;

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

    describe('managed with pip', () => {
      const projectFixture = path.join(fixtureDir, 'python', 'pip');

      beforeEach(() => {
        fse.copySync(projectFixture, projectDir);
        sinon
          .stub(inquirer, 'prompt')
          .resolves({ result: 'pip', confirm: true });
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

      it('installs as expected', async () => {
        const evalResults = async (err, argv, output) => {
          expect(err).toBeNull();

          const actualConfig = await fse.readFile(
            path.join(projectDir, 'appmap.yml'),
            { encoding: 'utf-8' }
          );
          expect(actualConfig).toEqual(expectedConfig);
        };
        await testE2E(
          pythonVersion,
          pythonPath,
          installAgent,
          initAgent,
          evalResults
        );
      });
    });

    describe('managed with poetry', () => {
      const projectFixture = path.join(fixtureDir, 'python', 'poetry');

      beforeEach(() => {
        fse.copySync(projectFixture, projectDir);
        sinon
          .stub(inquirer, 'prompt')
          .resolves({ result: 'poetry', confirm: true });
      });

      const installAgent = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('poetry');
        expect(cmdStruct.args).toEqual([
          'add',
          '--dev',
          '--allow-prereleases',
          'appmap',
        ]);
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
        const evalResults = async (err, argv, output) => {
          expect(err).toBeNull();

          const actualConfig = await fse.readFile(
            path.join(projectDir, 'appmap.yml'),
            { encoding: 'utf-8' }
          );
          expect(actualConfig).toEqual(expectedConfig);
        };
        await testE2E(
          pythonVersion,
          pythonPath,
          installAgent,
          initAgent,
          evalResults
        );
      });
    });
  });

  describe('Varied project configurations', () => {
    beforeEach(() => {
      sinon.stub(commandRunner, 'run').resolves({ stdout: '', stderr: '' });
    });

    it('requests the user to select a project type if more than one exist', async () => {
      const projectFixture = path.join(fixtureDir, 'python', 'mixed');
      const { name: projectDir } = tmp.dirSync({} as any);
      await fse.copy(projectFixture, projectDir);

      const promptStub = sinon
        .stub(inquirer, 'prompt')
        .resolves({ installerName: 'poetry', confirm: true });

      const installAgentStub = sinon
        .stub(PoetryInstaller.prototype, 'installAgent')
        .resolves();

      await invokeCommand(projectDir, () => {});

      const firstPrompt = promptStub.getCall(0).args[0] as inquirer.Question;
      expect(firstPrompt.name).toEqual('installerName');
      expect(installAgentStub).toBeCalled();
    });

    it('fails if no supported project is found', async () => {
      const { name: projectDir } = tmp.dirSync({} as any);
      const installProcedureStub = sinon
        .stub(AgentInstallerProcedure.prototype, 'run')
        .callThrough();

      await invokeCommand(projectDir, () => {});

      const { returnValue } = installProcedureStub.getCall(0);
      await expect(returnValue).rejects.toBeInstanceOf(ValidationError);
      await returnValue.catch((err) => {
        expect(err.message).toMatch('No supported project was found');
      });
    });
  });

  describe('when appmap-agent-validate returns a schema', () => {
    beforeEach(() => {
      const installer = new BundleInstaller('.');

      sinon
        .stub(AgentInstallerProcedure.prototype, 'availableInstallers')
        .resolves([installer]);
      sinon.stub(installer, 'environment').resolves({});

      sinon
        .stub(inquirer, 'prompt')
        .resolves({
          installerName: 'ruby',
          confirm: true,
          overwriteAppMapYml: 'Use existing',
        });

      sinon.stub(BundleInstaller.prototype, 'installAgent').resolves();

      sinon.stub(AgentInstallerProcedure.prototype, 'configExists').value(true);
      sinon.stub(AgentInstallerProcedure.prototype, 'loadConfig').returns({});

      sinon
        .stub(AgentInstallerProcedure.prototype, 'validateAgent')
        .resolves({ stdout: '{"errors": [], "schema": "{}"}', stderr: '' });
    });

    it('succeeds when the config syntax is valid', async () => {
      const validateConfig = sinon
        .stub(validator, 'validateConfig')
        .returns({ valid: true });
      await invokeCommand(projectDir, () => {});

      expect(validateConfig).toBeCalled();
    });

    it('fails when the config syntax is invalid', async () => {
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
      const validateConfig = sinon
        .stub(validator, 'validateConfig')
        .returns(validationResult);

      const installProcedureStub = sinon
        .stub(AgentInstallerProcedure.prototype, 'run')
        .callThrough();

      await invokeCommand(projectDir, () => {});

      const { returnValue } = installProcedureStub.getCall(0);
      await expect(returnValue).rejects.toBeInstanceOf(InstallError);
      await returnValue.catch((err) => {
        expect(err.error.message).toMatch('syntax error');
      });
    });
  });
});
