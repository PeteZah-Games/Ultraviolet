import { minify } from 'html-minifier-terser';

/**
 * Esbuild plugin to minify HTML inside template literals.
 * - Only minifies literals tagged with `html` or containing <!DOCTYPE html> (case-insensitive).
 * - Skips files in .pnpm/node_modules.
 * - Preserves ${...} placeholders by protecting/restoring them.
 * - Escapes backticks in literal text to avoid breaking JS.
 */
export default function htmlInJs() {
  return {
    name: 'htmlInJs',
    setup(build) {
      build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
        // Skip rewriting for dependencies
        if (args.path.includes('.pnpm') || args.path.includes('node_modules')) {
          const fs = await import('fs/promises');
          return { contents: await fs.readFile(args.path, 'utf8'), loader: 'js' };
        }

        const fs = await import('fs/promises');
        const source = await fs.readFile(args.path, 'utf8');

        // Match html`...` OR backtick strings containing <!DOCTYPE html> (case-insensitive)
        const htmlLiteralRegex = /html`([\s\S]*?)`|`([\s\S]*?<!DOCTYPE\s+html[\s\S]*?)`/gi;

        const transformed = await replaceAsync(source, htmlLiteralRegex, async (match, htmlTagged, htmlPlain) => {
          const original = htmlTagged || htmlPlain;

          // Protect ${...} placeholders so minifier/escaping doesn't touch them
          const { protectedText, placeholders } = protectPlaceholders(original);

          try {
            const minified = await minify(protectedText, {
              collapseWhitespace: true,
              removeComments: true,
              minifyCSS: true,
              minifyJS: true
            });

            // Escape backticks in the literal text (placeholders are not present yet)
            const escaped = minified.replace(/`/g, '\\`');

            // Restore placeholders exactly as they were (no escaping inside)
            const restored = restorePlaceholders(escaped, placeholders);

            // Preserve tag or plain template literal
            return match.startsWith('html`') ? 'html`' + restored + '`' : '`' + restored + '`';
          } catch (err) {
            console.warn('[htmlInJs] Minify failed in', args.path, err);
            return match; // fallback: leave original untouched
          }
        });

        return { contents: transformed, loader: 'js' };
      });
    }
  };
}

// Deterministic async replace: collect matches, await replacements, rebuild once
async function replaceAsync(str, regex, asyncFn) {
  const matches = [];
  let m;
  // Ensure global flag
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  while ((m = re.exec(str)) !== null) {
    matches.push(m);
    // Prevent infinite loops on zero-length matches
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  if (matches.length === 0) return str;

  const replacements = await Promise.all(matches.map((m) => asyncFn(m[0], m[1], m[2])));

  let result = '';
  let lastIndex = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    result += str.slice(lastIndex, m.index) + replacements[i];
    lastIndex = m.index + m[0].length;
  }
  result += str.slice(lastIndex);
  return result;
}

// Protect ${...} placeholders with markers
function protectPlaceholders(text) {
  const placeholders = [];
  const protectedText = text.replace(/\$\{[\s\S]*?\}/g, (m) => {
    const id = `__HTMLINJS_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(m);
    return id;
  });
  return { protectedText, placeholders };
}

// Restore placeholders by replacing markers back to original ${...}
function restorePlaceholders(text, placeholders) {
  let restored = text;
  placeholders.forEach((ph, idx) => {
    const id = `__HTMLINJS_PLACEHOLDER_${idx}__`;
    restored = restored.split(id).join(ph);
  });
  return restored;
}
