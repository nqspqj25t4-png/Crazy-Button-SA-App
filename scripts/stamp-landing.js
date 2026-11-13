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
// Expo's web template has no description or share tags, and writes the React-style `httpEquiv`.
const shopMeta = '<meta name="description" content="Shop Crazy Button SA: hoodies, jackets, knits, tees, hats and patches from KwaMashu, Umlazi and Durban.">'
  + '<meta property="og:title" content="Crazy Button SA Shop — Wear loud. Walk proud.">'
  + '<meta property="og:description" content="Mzansi\'s loudest streetwear, straight from KwaMashu, Umlazi and Durban.">'
  + '<meta property="og:image" content="https://crazybuttonsa.web.app/landing/img/look4.webp">'
  + '<meta property="og:url" content="https://crazybuttonsa.web.app/shop/">'
  + '<meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image">';
edit('dist/shop/index.html', (h) => h.replace('httpEquiv=', 'http-equiv=').replace('</title>', h.includes('og:title') ? '</title>' : `</title>${shopMeta}`));
// Older versions of the paintings stay in the repo but are not uploaded.
const used = ['dist/index.html', 'dist/landing/app.js'].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const pruned = fs.readdirSync('dist/landing/img/world').filter((f) => !used.includes(`/landing/img/world/${f}`));
pruned.forEach((f) => fs.unlinkSync(`dist/landing/img/world/${f}`));
console.log('landing stamped', v, 'analytics', a, '| unused paintings skipped:', pruned.length);
