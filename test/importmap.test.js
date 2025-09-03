import { describe, it } from 'mocha';
import { expect } from 'chai';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

describe('HTML pages import map', function() {
  it('all top-level HTML pages include a <script type="importmap">', async function() {
    const entries = await readdir('.', { withFileTypes: true });
    const htmlFiles = entries
      .filter(function(dirent) { return dirent.isFile() && dirent.name.endsWith('.html'); })
      .map(function(dirent) { return dirent.name; });

    const missing = [];
    for (const file of htmlFiles) {
      const content = await readFile(join('.', file), 'utf8');
      const hasImportMap = /<script[^>]+type=["']importmap["']/i.test(content);
      if (!hasImportMap) missing.push(file);
    }

    expect(missing, 'Missing import map in: ' + missing.join(', ')).to.have.length(0);
  });
});

