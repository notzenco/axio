export interface RepositoryTreeEntry {
  depth: number;
  folder: boolean;
  name: string;
  path: string;
}

export function repositoryTree(paths: string[], query: string, limit = 500): RepositoryTreeEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery) {
    return paths
      .filter((path) => path.toLowerCase().includes(normalizedQuery))
      .slice(0, limit)
      .map((path) => ({
        depth: Math.max(0, path.split("/").length - 1),
        folder: false,
        name: path.split("/").at(-1) ?? path,
        path,
      }));
  }

  const entries = new Map<string, RepositoryTreeEntry>();
  for (const path of paths) {
    const parts = path.split("/");
    parts.forEach((name, index) => {
      const entryPath = parts.slice(0, index + 1).join("/");
      entries.set(entryPath, {
        depth: index,
        folder: index < parts.length - 1,
        name,
        path: entryPath,
      });
    });
  }

  return [...entries.values()]
    .sort((left, right) => left.path.localeCompare(right.path))
    .slice(0, limit);
}
