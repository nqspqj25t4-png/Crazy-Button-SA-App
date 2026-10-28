// Gives the landing page's scripts a content-based version, so browsers always fetch
// the newest code after a deploy (the hosting caches .js files for a year), and adds
// the shared analytics + consent script to the /shop app.
const fs = require('fs'), crypto = require('crypto');
const hash = (...files) => { const h = crypto.createHash('md5'); files.forEach((f) => h.update(fs.readFileSync(f))); return h.digest('hex').slice(0, 10); };
const edit = (f, fn) => fs.writeFileSync(f, fn(fs.readFileSync(f, 'utf8')));

const v = hash('landing/app.js', 'landing/img/logo-shapes.json');
const a = hash('landing/cb-analytics.js');
const tag = `/landing/cb-analytics.js?v=${a}`;

edit('dist/index.html', (h) => h.replace('/landing/app.js"', `/landing/app.js?v=${v}"`).replace('/landing/cb-analytics.js"', `${tag}"`));
edit('dist/landing/app.js', (js) => js.replace("'/landing/img/logo-shapes.json'", `'/landing/img/logo-shapes.json?v=${v}'`));
edit('dist/landing/privacy.html', (h) => h.replace('/landing/cb-analytics.js"', `${tag}"`));
edit('dist/shop/index.html', (h) => (h.includes('cb-analytics.js') ? h : h.replace('</body>', `<script src="${tag}"></script></body>`)));
console.log('landing stamped', v, 'analytics', a);
