import UI from '../userInteraction';
import AgentProcedure from './agentProcedure';

export default class AgentStatusProcedure extends AgentProcedure {
  async run(): Promise<void> {
    console.log('\nAgent environment:');
    const env = await this.getEnvironmentForDisplay();
    console.log(`${env.join('\n')}\n`);

    await this.verifyProject();
    await this.validateProject(true);

    UI.success('Success!');
  }
}
