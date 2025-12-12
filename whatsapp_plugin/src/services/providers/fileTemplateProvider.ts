import { promises as fs } from "node:fs";
import path from "node:path";

export interface LoadedTemplate {
  name: string;
  language: string;
  bodyText: string;
}

export interface TemplateProvider {
  loadTemplate(name: string, language: string): Promise<LoadedTemplate>;
}

export class FileTemplateProvider implements TemplateProvider {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  async loadTemplate(name: string, language: string): Promise<LoadedTemplate> {
    const filename = `${name}.${language}.txt`;
    const filepath = path.join(this.baseDir, filename);
    const bodyText = await fs.readFile(filepath, "utf8");
    return { name, language, bodyText };
  }
}


