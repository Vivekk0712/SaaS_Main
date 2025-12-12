import Handlebars from "handlebars";
import type { TemplateProvider } from "./providers/fileTemplateProvider.js";

export class TemplateRenderer {
  private readonly provider: TemplateProvider;

  constructor(provider: TemplateProvider) {
    this.provider = provider;
  }

  async render(
    templateName: string,
    payload: Record<string, unknown>,
    language: string
  ): Promise<{ textBody: string; parameters: Array<{ type: "text"; text: string }> }> {
    const template = await this.provider.loadTemplate(templateName, language);
    const compiled = Handlebars.compile(template.bodyText, { noEscape: true });
    const textBody = compiled(payload);

    // Build WhatsApp parameters from payload insertion order
    const parameters: Array<{ type: "text"; text: string }> = [];
    const regex = /{{\s*([\w.]+)\s*}}/g;
    const keys: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(template.bodyText)) !== null) {
      keys.push(match[1]);
    }
    for (const key of keys) {
      const value = (payload as Record<string, unknown>)[key];
      parameters.push({ type: "text", text: String(value ?? "") });
    }

    return { textBody, parameters };
  }
}


