// Gives the landing page's script a content-based version, so browsers always fetch
// the newest code after a deploy (the hosting caches .js files for a year).
const fs = require('fs'), crypto = require('crypto');
const v = crypto.createHash('md5').update(fs.readFileSync('landing/app.js')).update(fs.readFileSync('landing/img/logo-shapes.json')).digest('hex').slice(0, 10);
const f = 'dist/index.html';
let html = fs.readFileSync(f, 'utf8').replace('/landing/app.js"', `/landing/app.js?v=${v}"`);
fs.writeFileSync(f, html);
let js = fs.readFileSync('dist/landing/app.js', 'utf8').replace("'/landing/img/logo-shapes.json'", `'/landing/img/logo-shapes.json?v=${v}'`);
fs.writeFileSync('dist/landing/app.js', js);
console.log('landing stamped', v);
