// Indbyggede billeder. Stierne i content.json ("img/e1.jpg") slås op her,
// så Vite kan inline dem i single-file-buildet.
const files = import.meta.glob<string>('../assets/img/*', { eager: true, import: 'default' });

const byPath: Record<string, string> = {};
for (const [file, url] of Object.entries(files)) {
  byPath['img/' + file.split('/').pop()] = url;
}

export function builtinImage(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return byPath[path];
}

export function isBuiltinImage(path: string | null | undefined): boolean {
  return !!path && path in byPath;
}

export const jerseyImage = (id: string) => byPath[`img/j_${id}.png`];
export const titleImage = byPath['img/title.jpg'];
export const ridersImage = byPath['img/riders.jpg'];
