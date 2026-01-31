
import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Plus, Trash2, Download, FileText, Check, Copy } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfMapper = ({ onSave, initialFields, onCancel }) => {
  const [numPages, setNumPages] = useState(null);
  const [fields, setFields] = useState(initialFields || []);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setError(null);
  }

  function onDocumentLoadError(err) {
    console.error('PDF Load Error:', err);
    setError('No se pudo cargar el PDF. Asegúrate de que "formato.pdf" esté en la carpeta public.');
  }

  // Dragging & Resizing state
  const [draggingField, setDraggingField] = useState(null);
  const [resizingField, setResizingField] = useState(null);

  // Mouse move handler (for dragging & resizing)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggingField) {
        const deltaX = e.clientX - draggingField.startX;
        const deltaY = e.clientY - draggingField.startY;

        setFields(fields.map(f => 
          f.id === draggingField.id ? { 
            ...f, 
            x: draggingField.originalX + deltaX, 
            y: draggingField.originalY + deltaY 
          } : f
        ));
      } else if (resizingField) {
        const deltaX = e.clientX - resizingField.startX;
        const deltaY = e.clientY - resizingField.startY;

        setFields(fields.map(f => 
          f.id === resizingField.id ? { 
            ...f, 
            width: Math.max(20, resizingField.originalWidth + deltaX), 
            height: Math.max(10, resizingField.originalHeight + deltaY) 
          } : f
        ));
      }
    };

    const handleMouseUp = () => {
      setDraggingField(null);
      setResizingField(null);
    };

    if (draggingField || resizingField) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingField, resizingField, fields]);

  const handlePageClick = (e, pageIndex) => {
    // Prevent creating field if we just finished dragging
    if (!isSelecting || draggingField) return;

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Default field size (approximate)
    const newField = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Field ${fields.length + 1}`,
      page: pageIndex,
      x,
      y,
      width: 150,
      height: 25,
      value: ''
    };

    setFields([...fields, newField]);
    setIsSelecting(false);
  };

  const startDrag = (e, field) => {
    e.stopPropagation();
    setDraggingField({
      id: field.id,
      startX: e.clientX,
      startY: e.clientY,
      originalX: field.x,
      originalY: field.y
    });
  };

  const startResize = (e, field) => {
    e.stopPropagation();
    setResizingField({
      id: field.id,
      startX: e.clientX,
      startY: e.clientY,
      originalWidth: field.width,
      originalHeight: field.height
    });
  };

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateFieldName = (id, name) => {
    setFields(fields.map(f => f.id === id ? { ...f, name } : f));
  };

  const [draggedIndex, setDraggedIndex] = useState(null);

  const onDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // For Firefox compatibility
    e.dataTransfer.setData("text/html", e.target.parentNode);
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFields = [...fields];
    const item = newFields[draggedIndex];
    newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, item);
    
    setDraggedIndex(index);
    setFields(newFields);
  };

  const toggleFieldType = (id) => {
    setFields(fields.map(f => f.id === id ? { 
      ...f, 
      type: f.type === 'checkbox' ? 'text' : 'checkbox' 
    } : f));
  };

  const duplicateField = (field) => {
    const newField = {
      ...field,
      id: Date.now() + Math.random(),
      x: field.x + 15,
      y: field.y + 15
    };
    setFields([...fields, newField]);
  };

  const updateFieldOrder = (id, newOrder) => {
    const index = parseInt(newOrder) - 1;
    if (isNaN(index) || index < 0 || index >= fields.length) return;
    
    const oldIndex = fields.findIndex(f => f.id === id);
    if (oldIndex === -1 || oldIndex === index) return;
    
    const newFields = [...fields];
    const [movedField] = newFields.splice(oldIndex, 1);
    newFields.splice(index, 0, movedField);
    setFields(newFields);
  };

  return (
    <div className="pdf-mapper">
      <div className="sidebar">
        <h2>Diseñador de Campos</h2>
        <p className="hint">Haz clic en "Agregar Campo" y luego en el PDF.</p>
        
        <button 
          className={`btn-primary ${isSelecting ? 'active' : ''}`}
          onClick={() => setIsSelecting(!isSelecting)}
        >
          <Plus size={18} />
          {isSelecting ? 'Haz clic en el PDF...' : 'Agregar Campo'}
        </button>

        <div className="fields-list">
          {fields.map((field, index) => (
              <div 
                key={field.id} 
                className={`field-item ${draggedIndex === index ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={() => setDraggedIndex(null)}
              >
                <div className="field-order-control">
                  <input
                    type="number"
                    className="order-input"
                    value={index + 1}
                    onChange={(e) => updateFieldOrder(field.id, e.target.value)}
                    min="1"
                    max={fields.length}
                  />
                </div>
                <div className="field-content-box">
                  <input 
                    type="text" 
                    value={field.name}
                    onChange={(e) => updateFieldName(field.id, e.target.value)}
                  />
                  <div className="field-type-toggle">
                    <button 
                      className={`type-btn ${field.type !== 'checkbox' ? 'active' : ''}`}
                      onClick={() => toggleFieldType(field.id)}
                    >
                      Texto
                    </button>
                    <button 
                      className={`type-btn ${field.type === 'checkbox' ? 'active' : ''}`}
                      onClick={() => toggleFieldType(field.id)}
                    >
                      X
                    </button>
                  </div>
                </div>
                <div className="field-actions">
                  <button 
                    className="btn-icon" 
                    onClick={() => duplicateField(field)}
                    title="Duplicar"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    className="btn-icon danger" 
                    onClick={() => removeField(field.id)}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
          ))}
          
          {fields.length === 0 && (
            <div className="empty-state">
              No hay campos definidos.
            </div>
          )}
        </div>

        <div className="mapper-actions">
          <button 
            className="btn-success full-width"
            onClick={() => onSave(fields)}
            disabled={fields.length === 0}
          >
            <Check size={18} />
            Guardar Configuración
          </button>

          <button 
            className="btn-secondary full-width"
            onClick={() => {
              if (fields.length === 0) {
                alert('Primero debes agregar al menos un campo al PDF (botón "Agregar Campo").');
                return;
              }
              const json = JSON.stringify(fields, null, 2);
              console.log(json);
              navigator.clipboard.writeText(json);
              alert('¡CÓDIGO COPIADO! Pégalo en el chat.');
            }}
            style={{ marginTop: '1rem', border: '2px dashed #10b981', color: '#10b981' }}
          >
            <Download size={18} />
            EXPORTAR CÓDIGO (CLICK AQUÍ)
          </button>

          <button 
            className="btn-primary full-width"
            onClick={async () => {
              if (confirm('Esto escaneará el PDF y creará campos automáticos. ¿Continuar?')) {
                 const newFields = [];
                 const loadingTask = pdfjs.getDocument('/formato.pdf');
                 const doc = await loadingTask.promise;
                 
                 for (let i = 1; i <= doc.numPages; i++) {
                   const page = await doc.getPage(i);
                   const content = await page.getTextContent();
                   const viewport = page.getViewport({ scale: 1.0 }); // Default scale
                   
                   // Coordinate conversion factor (PDF -> DOM approx)
                   // We assume rendered width is 800px
                   const scale = 800 / viewport.width;

                   content.items.forEach(item => {
                     // Filter out empty or very short strings to reduce noise
                     if (item.str.trim().length > 3) {
                       const tx = item.transform; // [scaleX, skewY, skewX, scaleY, x, y]
                       // PDF coordinates: (0,0) is bottom-left. HTML: (0,0) is top-left.
                       
                       const pdfX = tx[4];
                       const pdfY = tx[5];
                       
                       // Calculate DOM X/Y
                       const x = pdfX * scale;
                       // Invert Y axis: Height - Y
                       const y = (viewport.height - pdfY) * scale;

                        newFields.push({
                          id: `auto-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                         name: item.str,
                         page: i - 1, // 0-indexed
                         x: x, 
                         y: y, // Place slightly below text
                         width: 150, // Default width
                         height: 25,
                         value: ''
                       });
                     }
                   });
                 }
                 setFields([...fields, ...newFields]);
                 alert(`¡Auto-detección completada! Se encontraron ${newFields.length} posibles campos. Revisa y ajusta.`);
              }
            }}
            style={{ marginTop: '1rem', border: '1px solid #3b82f6' }}
          >
            <FileText size={18} />
            AUTO-DETECTAR CAMPOS (Beta)
          </button>
          
          {initialFields && initialFields.length > 0 && (
            <button 
              className="btn-secondary full-width"
              onClick={onCancel}
              style={{ marginTop: '0.5rem' }}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="pdf-preview" ref={containerRef}>
        {error ? (
          <div className="error-message" style={{ color: 'white', padding: '2rem' }}>
            {error}
          </div>
        ) : (
          <Document
            file={`${import.meta.env.BASE_URL}formato.pdf`.replace(/\/+/g, '/')}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="pdf-document"
            loading={<div style={{color: 'white'}}>Cargando PDF...</div>}
            error={<div style={{color: 'white'}}>Error al cargar PDF</div>}
          >
            {Array.from(new Array(numPages || 0), (el, index) => (
              <div key={`page_${index + 1}`} className="page-wrapper">
                <div 
                  className="page-overlay"
                  onClick={(e) => handlePageClick(e, index)}
                  style={{ cursor: isSelecting ? 'crosshair' : 'default' }}
                >
                  {/* Render fields for this page */}
                  {fields.filter(f => f.page === index).map(field => (
                    <div
                      key={field.id}
                      className="field-marker"
                      onMouseDown={(e) => startDrag(e, field)}
                      style={{
                        left: field.x,
                        top: field.y,
                        width: field.width,
                        height: field.height,
                        cursor: 'grab',
                        backgroundColor: (draggingField?.id === field.id || resizingField?.id === field.id) 
                          ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 226, 88, 0.4)',
                        fontSize: `${Math.min(14, Math.max(8, field.height * 0.5))}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span style={{ 
                        width: '100%', 
                        textAlign: 'center', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        padding: '0 4px'
                      }}>
                        {field.name}
                      </span>
                      <div 
                        className="resize-handle" 
                        onMouseDown={(e) => startResize(e, field)}
                      />
                    </div>
                  ))}
                </div>
                <Page 
                  pageNumber={index + 1} 
                  width={800}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
          </Document>
        )}
      </div>
    </div>
  );
};

export default PdfMapper;
