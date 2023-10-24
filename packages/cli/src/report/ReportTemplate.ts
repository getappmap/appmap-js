export class ReportTemplate {
  constructor(
    public template: HandlebarsTemplateDelegate,
    public helpers: Record<string, Function>
  ) {}

  generateMarkdown(data: any): string {
    return this.template(data, {
      helpers: this.helpers,
      allowProtoPropertiesByDefault: true,
    });
  }
}
