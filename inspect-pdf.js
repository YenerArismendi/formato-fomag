
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function run() {
  try {
    const pdfBytes = fs.readFileSync('public/formato.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log('--- PDF Info ---');
    const pages = pdfDoc.getPages();
    console.log(`Total Pages: ${pages.length}`);
    pages.forEach((p, i) => {
        const { width, height } = p.getSize();
        console.log(`Page ${i + 1}: ${width} x ${height}`);
    });

    console.log('--- PDF Fields ---');
    fields.forEach(field => {
      const type = field.constructor.name;
      const name = field.getName();
      console.log(`${name} (${type})`);
    });
    console.log('------------------');
  } catch (err) {
    console.error('Error reading PDF:', err);
  }
}

run();
