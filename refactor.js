const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    fs.statSync(fp).isDirectory() ? walk(fp, callback) : callback(fp);
  });
}

walk('web/src/components', (filePath) => {
  if (!filePath.endsWith('.jsx')) return;
  if (filePath.includes('LandingPage.jsx')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Remove inline background overrides that make cards inconsistent:
  // surface-solid inside apple-solid-card overrides the theme variable
  content = content.replace(/,\s*background:\s*'var\(--surface-solid\)'/g, '');
  content = content.replace(/background:\s*'var\(--surface-solid\)',\s*/g, '');
  content = content.replace(/,\s*background:\s*'transparent'/g, '');
  content = content.replace(/background:\s*'transparent',\s*/g, '');

  // Remove maxWidth + margin: 0 auto centering patterns on top-level containers
  content = content.replace(/maxWidth:\s*'?\d+px'?,\s*/g, '');
  content = content.replace(/,\s*margin:\s*'0 auto'/g, '');
  content = content.replace(/margin:\s*'0 auto',\s*/g, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Cleaned:', filePath);
  }
});

console.log('Done.');
