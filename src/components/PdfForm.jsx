
import { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Download, Edit2, Users, Plus, Minus, UserCheck } from 'lucide-react';

const PdfForm = ({ fields, onEdit }) => {
  const [numBeneficiaries, setNumBeneficiaries] = useState(0);

  const [formData, setFormData] = useState(
    fields.reduce((acc, field) => ({ ...acc, [field.id]: '' }), {})
  );

  const activeFields = fields.filter(f => {
    // Robust detection: use property if exists, otherwise check name (for legacy storage)
    const isBeneficiary = f.beneficiaryIndex !== undefined || 
                         f.section === 'beneficiario' || 
                         f.name.toLowerCase().includes('beneficiario') ||
                         f.groupId?.includes('beneficiario');
    
    if (!isBeneficiary) return true; // Cotizante
    
    // For legacy data without index, assume it's the first one
    const bIndex = f.beneficiaryIndex || 1;
    return bIndex <= numBeneficiaries;
  });

  const handleDownload = async () => {
    try {
      // Load the existing PDF
      const pdfPath = `${import.meta.env.BASE_URL}formato.pdf`.replace(/\/+/g, '/');
      const existingPdfBytes = await fetch(pdfPath).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      // Draw text for each field
      activeFields.forEach(field => {
        const page = pages[field.page];
        const { width, height } = page.getSize();
        const scale = width / 800; 

        let valueToDraw = '';
        if (field.type === 'checkbox') {
          // Robust check for truthy values (Boolean true, 'on', 'X', or matching ID from select)
          const val = formData[field.id];
          if (val === true || val === 'on' || val === 'X' || val === field.id) {
            valueToDraw = 'X';
          } else {
            return;
          }
        } else if (field.type === 'date') {
          const dateVal = formData[field.id];
          if (dateVal) {
            const [year, month, day] = dateVal.split('-');
            valueToDraw = `${day}/${month}/${year}`;
          }
        } else {
          valueToDraw = formData[field.id] || '';
        }

        if (!valueToDraw) return;

        const fontSize = 9 * scale;
        const textWidth = helveticaBold.widthOfTextAtSize(valueToDraw, fontSize);
        const fieldWidth = field.width * scale;
        const fieldHeight = field.height * scale;
        
        // Horizontal centering
        const centeredX = (field.x * scale) + (fieldWidth / 2) - (textWidth / 2);
        
        // Vertical centering (approximate font baseline at ~1/3 from bottom of height)
        const centeredY = height - (field.y * scale) - (fieldHeight / 2) - (fontSize / 4);

        page.drawText(valueToDraw, {
          x: centeredX,
          y: centeredY,
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

  // Group fields by groupId
  const groupedFields = activeFields.reduce((acc, field) => {
    if (field.groupId) {
      if (!acc[field.groupId]) {
        acc[field.groupId] = {
          isGroup: true,
          label: field.groupLabel,
          fields: []
        };
      }
      acc[field.groupId].fields.push(field);
    } else {
      acc[field.id] = field;
    }
    return acc;
  }, {});

  const handleGroupChange = (groupId, selectedFieldId) => {
    const groupFields = groupedFields[groupId].fields;
    const newData = { ...formData };
    groupFields.forEach(f => {
      // Robust comparison handling numeric IDs vs string values from DOM
      newData[f.id] = String(f.id) === String(selectedFieldId);
    });
    setFormData(newData);
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
          <div className="form-section-header">
            <UserCheck size={18} />
            <span>Información del Cotizante</span>
          </div>

          {Object.entries(groupedFields).map(([key, item]) => {
            const isBeneficiaryField = (item.isGroup ? item.fields[0] : item).beneficiaryIndex;
            if (isBeneficiaryField) return null; // Handle beneficiaries separately below

            if (item.isGroup) {
              const selectedValue = item.fields.find(f => formData[f.id] === true)?.id || "";
              return (
                <div key={key} className="form-group group-container compact-select">
                  <label className="group-label">{item.label}</label>
                  <select
                    value={selectedValue}
                    onChange={(e) => handleGroupChange(key, e.target.value)}
                    className="compact-dropdown"
                  >
                    <option value="">Seleccione una opción...</option>
                    {item.fields.map(field => (
                      <option key={field.id} value={field.id}>
                        {field.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            const field = item;
            const isCheckbox = field.type === 'checkbox';
            const isDate = field.type === 'date';

            return (
              <div key={field.id} className={`form-group ${isCheckbox ? 'as-checkbox' : ''}`}>
                <label title={field.name}>{field.name}</label>
                {isCheckbox ? (
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={formData[field.id] === true}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })}
                    />
                    <span>Marcar con X</span>
                  </div>
                ) : (
                  <input
                    type={isDate ? "date" : "text"}
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    placeholder={isDate ? "" : `Ingrese ${field.name}`}
                    className={isDate ? "date-input" : ""}
                  />
                )}
              </div>
            );
          })}

          <div className="beneficiaries-config-card">
            <div className="config-header">
              <div className="config-title">
                <Users size={18} />
                <h3>Ingresar Beneficiarios</h3>
              </div>
              <div className="config-controls">
                <span className="count-label">Beneficiarios activos: <strong>{numBeneficiaries}</strong></span>
                <div className="counter-btns">
                  {numBeneficiaries < 6 && (
                    <button 
                      className="btn-success small-add"
                      onClick={() => setNumBeneficiaries(prev => prev + 1)}
                    >
                      <Plus size={16} />
                      Agregar Beneficiario
                    </button>
                  )}
                  {numBeneficiaries > 0 && (
                    <button 
                      className="btn-danger-outline small-add"
                      onClick={() => setNumBeneficiaries(prev => prev - 1)}
                    >
                      <Minus size={16} />
                      Quitar Último
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {[1, 2, 3, 4, 5, 6].slice(0, numBeneficiaries).map(bIdx => (
            <div key={`b-section-${bIdx}`} className="beneficiary-render-group">
              <div className="form-section-header beneficiario">
                <Users size={18} />
                <span>Beneficiario {bIdx}</span>
              </div>
              
              {Object.entries(groupedFields).filter(([_, item]) => {
                const f = item.isGroup ? item.fields[0] : item;
                return f.beneficiaryIndex === bIdx;
              }).map(([key, item]) => {
                if (item.isGroup) {
                  const selectedValue = item.fields.find(f => formData[f.id] === true)?.id || "";
                  return (
                    <div key={key} className="form-group group-container compact-select">
                      <label className="group-label">{item.label}</label>
                      <select
                        value={selectedValue}
                        onChange={(e) => handleGroupChange(key, e.target.value)}
                        className="compact-dropdown"
                      >
                        <option value="">Seleccione una opción...</option>
                        {item.fields.map(field => (
                          <option key={field.id} value={field.id}>
                            {field.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                const field = item;
                const isCheckbox = field.type === 'checkbox';
                
                // Helper to infer input type
                const getInputType = (f) => {
                  if (f.type === 'date') return 'date';
                  const n = f.name.toLowerCase();
                  if (n.includes('email') || n.includes('correo')) return 'email';
                  if (n.includes('tel') || n.includes('cel') || n.includes('fijo')) return 'tel';
                  return 'text';
                };
                
                const inputType = getInputType(field);

                return (
                  <div key={field.id} className={`form-group ${isCheckbox ? 'as-checkbox' : ''}`}>
                    <label title={field.name}>{field.name}</label>
                    {isCheckbox ? (
                      <div className="checkbox-wrapper">
                        <input
                          type="checkbox"
                          checked={formData[field.id] === true}
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })}
                        />
                        <span>Marcar con X</span>
                      </div>
                    ) : (
                      <input
                        type={inputType}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        placeholder={inputType === 'date' ? "" : `Ingrese ${field.name}`}
                        className={inputType === 'date' ? "date-input" : ""}
                        inputMode={inputType === 'tel' ? 'numeric' : undefined}
                      />
                    )}
                  </div>
                );
              })}
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
