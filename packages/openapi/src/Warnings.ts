export interface WarningProvider {
  warnings: Warnings;

  containedWarningProviders: WarningProvider[];
}

export default class Warnings {
  warnings: Record<string, string[]> = {};

  dup(): Warnings {
    const result = new Warnings();
    result.warnings = { ...this.warnings };
    return result;
  }

  add(key: string, message: string) {
    if (!this.warnings[key]) this.warnings[key] = [];

    this.warnings[key].push(message);
  }

  merge(warningProviders: WarningProvider[]): void {
    for (const warningProvider of warningProviders) {
      Object.entries(warningProvider.warnings.warnings).forEach(([key, messages]) => {
        messages.forEach((message) => {
          this.add(key, message);
        });
      });
      this.merge(warningProvider.containedWarningProviders);
    }
  }

  static messages(warnings: Record<string, string[]>): string[] {
    return Object.entries(warnings).reduce((memo, [key, messages]) => {
      memo.push(...messages.map((message) => `${key}: ${message}`));
      return memo;
    }, [] as string[]);
  }
}
