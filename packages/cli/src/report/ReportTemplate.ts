export class ReportTemplate {
  constructor(
    public template: HandlebarsTemplateDelegate,
    // eslint-disable-next-line @typescript-eslint/ban-types
    public helpers: Record<string, Function>
  ) {}

  generateMarkdown(data: any): string {
    return this.template(data, {
      helpers: this.helpers,
      allowProtoPropertiesByDefault: true,
    });
  }
}
