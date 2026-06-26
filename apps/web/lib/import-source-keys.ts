export function getPublicImportSourceKey(name: string) {
  return `public:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
