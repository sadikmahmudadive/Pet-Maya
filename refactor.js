const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk('web/src/components', (filePath) => {
  if (!filePath.endsWith('.jsx')) return;
  if (filePath.includes('LandingPage.jsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  if (!filePath.includes('Shop.jsx')) {
    content = content.replace(/className="apple-promo-card"/g, 'className="apple-solid-card"');
  }
  
  content = content.replace(/,\s*border:\s*'[^']+'/g, '');
  content = content.replace(/border:\s*'[^']+',\s*/g, '');
  content = content.replace(/,\s*borderBottom:\s*'[^']+'/g, '');
  content = content.replace(/borderBottom:\s*'[^']+',\s*/g, '');
  content = content.replace(/,\s*borderColor:\s*'[^']+'/g, '');
  content = content.replace(/borderColor:\s*'[^']+',\s*/g, '');
  content = content.replace(/,\s*boxShadow:\s*'[^']+'/g, '');
  content = content.replace(/boxShadow:\s*'[^']+',\s*/g, '');
  
  content = content.replace(/className="glass-card"/g, 'className="apple-solid-card"');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
  }
});
console.log('Mass replacement complete');
