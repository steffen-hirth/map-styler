import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EN, t } from './i18n';
import { LABEL_LANGUAGES, TOOLTIP_FONTS, TOOLTIP_SHADOWS } from './app/app-schema';
import { TEMPLATES } from './app/templates';
import { GROUPS, propLabel, PROPS } from './runtime/style/spec';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) && !/i18n\.ts$/.test(name) ? [path] : [];
  });
}

describe('i18n', () => {
  it('has an English translation for every t() call', () => {
    const missing: string[] = [];
    for (const file of sourceFiles(join(__dirname))) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) {
        const key = match[1].replace(/\\'/g, "'");
        if (!(key in EN)) missing.push(`${file}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('translates data labels', () => {
    const keys = [
      ...TEMPLATES.flatMap((tpl) => [tpl.name, tpl.description]),
      ...GROUPS.map(([, label]) => label),
      ...LABEL_LANGUAGES.map((o) => o.label),
      ...TOOLTIP_FONTS.map((o) => o.label),
      ...TOOLTIP_SHADOWS.map((o) => o.label),
    ];
    expect(keys.filter((key) => !(key in EN))).toEqual([]);
  });

  it('labels every known property in English', () => {
    const names = Object.values(PROPS).flatMap((spec) => [...Object.keys(spec.paint), ...Object.keys(spec.layout)]);
    const untranslated = names.filter((name) => /[äöüßÄÖÜ]/.test(propLabel(name)));
    expect(untranslated).toEqual([]);
  });

  it('fills placeholders', () => {
    expect(t('{n} Ebenen', { n: 3 })).toBe('3 layers');
  });
});
