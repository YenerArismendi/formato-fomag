
import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function run() {
  try {
    const data = new Uint8Array(fs.readFileSync('public/formato.pdf'));
    const loadingTask = pdfjsLib.getDocument(data);
    const doc = await loadingTask.promise;
    
    console.log(`Pages: ${doc.numPages}`);
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    
    console.log('--- Text Items (Sample) ---');
    // Filter for relevant keywords to keep output clean
    const items = content.items.filter(item => item.str.length > 3).slice(0, 20);
    
    items.forEach(item => {
      console.log(`Text: "${item.str}" | X: ${item.transform[4]}, Y: ${item.transform[5]}`);
    });

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
