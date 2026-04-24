/**
 * Splits YAML frontmatter from a markdown body.
 * Accepts both `---\n...\n---\n` and `---\r\n...\r\n---\r\n` delimiters.
 */
export function splitFrontmatter(raw: string): { frontmatter: string | null; body: string } {
  if (!raw.startsWith('---')) return { frontmatter: null, body: raw };
  const afterOpen = raw.slice(3);
  // Require a newline right after opening ---
  if (!afterOpen.startsWith('\n') && !afterOpen.startsWith('\r\n')) {
    return { frontmatter: null, body: raw };
  }
  const closeMatch = afterOpen.match(/\r?\n---\r?\n/);
  if (!closeMatch || closeMatch.index === undefined) return { frontmatter: null, body: raw };
  const frontmatter = afterOpen.slice(0, closeMatch.index);
  const body = afterOpen.slice(closeMatch.index + closeMatch[0].length);
  return { frontmatter, body };
}
