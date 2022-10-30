import UI from '../userInteraction';
import AgentProcedure from './agentProcedure';
import { formatValidationError } from './ValidationResult';

export default class AgentStatusProcedure extends AgentProcedure {
  async run(): Promise<void> {
    console.log('\nAgent environment:');
    const env = await this.getEnvironmentForDisplay();
    console.log(`${env.join('\n')}\n`);

    await this.verifyProject();
    const result = await this.validateProject(true);

    UI.success('Success!');

    if (result?.errors) for (const warning of result.errors.filter((e) => e.level === 'warning'))
      UI.warn(formatValidationError(warning));
  }
}
