const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../../../../../../../../Desktop/april webb/Two meridian/Working so faar');

const server = http.createServer((req, res) => {
  let filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url);
  // remove query strings
  filePath = filePath.split('?')[0];
  
  let extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.svg': contentType = 'image/svg+xml'; break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(8123, async () => {
  console.log('Server running on 8123');
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    await page.goto('http://localhost:8123/');
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
  } catch(e) {
    console.error('Puppeteer error:', e);
  }
  server.close();
});
