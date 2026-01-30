
import { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Download, Edit2 } from 'lucide-react';

const PdfForm = ({ fields, onEdit }) => {
  const [formData, setFormData] = useState(
    fields.reduce((acc, field) => ({ ...acc, [field.id]: '' }), {})
  );

  const handleDownload = async () => {
    try {
      // Load the existing PDF
      const pdfPath = `${import.meta.env.BASE_URL}formato.pdf`.replace(/\/+/g, '/');
      const existingPdfBytes = await fetch(pdfPath).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      // Draw text for each field
      fields.forEach(field => {
        const page = pages[field.page];
        const { width, height } = page.getSize();
        const scale = width / 800; 

        const text = formData[field.id] || '';
        const value = field.type === 'checkbox' ? (formData[field.id] ? 'X' : '') : text;
        
        if (field.type === 'checkbox' && !formData[field.id]) return;

        const fontSize = 9 * scale;
        const textToDraw = field.type === 'checkbox' ? 'X' : text;
        const textWidth = helveticaBold.widthOfTextAtSize(textToDraw, fontSize);
        const fieldWidth = field.width * scale;
        
        const centeredX = (field.x * scale) + (fieldWidth / 2) - (textWidth / 2);

        page.drawText(textToDraw, {
          x: centeredX,
          y: height - (field.y * scale) - (12 * scale), 
          size: fontSize,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'formato-diligenciado.pdf';
      link.click();
    } catch (err) {
      console.error('Error saving PDF:', err);
      alert('Hubo un error al generar el PDF.');
    }
  };

  return (
    <div className="pdf-form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>Diligenciar Formulario</h2>
          <button className="btn-secondary" onClick={onEdit}>
            <Edit2 size={16} />
            Editar Campos
          </button>
        </div>

        <div className="form-grid">
          {fields.map(field => (
            <div key={field.id} className={`form-group ${field.type === 'checkbox' ? 'as-checkbox' : ''}`}>
              <label>{field.name}</label>
              {field.type === 'checkbox' ? (
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={formData[field.id] || false}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })}
                  />
                  <span>Marcar con X</span>
                </div>
              ) : (
                <input
                  type="text"
                  value={formData[field.id] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  placeholder={`Ingrese ${field.name}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button className="btn-success large" onClick={handleDownload}>
            <Download size={20} />
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfForm;
