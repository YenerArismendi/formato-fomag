
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function run() {
  try {
    const pdfBytes = fs.readFileSync('public/formato.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
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
