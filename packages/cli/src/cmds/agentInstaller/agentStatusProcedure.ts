import UI from "../userInteraction";
import AgentProcedure from "./agentProcedure";
import Yargs from 'yargs';
export default class AgentStatusProcedure extends AgentProcedure {
  async run(): Promise<void> {
    const installers = await this.getInstallersForProject();
    let installer;
    if (installers.length === 1) {
      installer = installers[0];
    }
    else {
      installer = await this.chooseInstaller(installers);
    }
    
    console.log('\nAgent environment:');
    const env = await this.getEnvironmentForDisplay(installer)
    console.log(`${env.join('\n')}\n`);

    await this.verifyProject(installer);

    await this.validateProject(installer, true);

    UI.success('Success!');
  }
}