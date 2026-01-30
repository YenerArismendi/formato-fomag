
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
        const fontSize = 9 * scale;
        const textWidth = helveticaBold.widthOfTextAtSize(text, fontSize);
        const fieldWidth = field.width * scale;
        
        // Calculate centered X: start pos + (fieldWidth/2) - (textWidth/2)
        const centeredX = (field.x * scale) + (fieldWidth / 2) - (textWidth / 2);

        page.drawText(text, {
          x: centeredX,
          y: height - (field.y * scale) - (12 * scale), 
          size: fontSize,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
      });

      const pdfBytes = await pdfDoc.save();

      // Trigger download
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

  if (fields.length === 0) {
    return (
      <div className="pdf-form-container">
        <div className="form-card empty">
           <h2>Configuración Necesaria</h2>
           <p style={{ margin: '1rem 0', color: '#94a3b8' }}>
             <strong>¿Por qué no veo campos?</strong><br/>
             Este PDF es un documento "plano" (sin campos digitales).<br/>
             Necesitas indicarle al programa dónde escribir los datos.
           </p>
           <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
             Solo tienes que hacerlo <strong>una vez</strong>. La configuración se guardará.
           </p>
           <button className="btn-primary" onClick={onEdit}>
             <Edit2 size={16} />
             Comenzar a Mapear
           </button>
        </div>
      </div>
    );
  }

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
            <div key={field.id} className="form-group">
              <label>{field.name}</label>
              <input
                type="text"
                value={formData[field.id]}
                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                placeholder={`Ingrese ${field.name}`}
              />
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
