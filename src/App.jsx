
import { useState, useEffect } from 'react';
import PdfMapper from './components/PdfMapper';
import PdfForm from './components/PdfForm';
import { defaultFields } from './data/defaultFields';
import { Sun, Moon, RotateCcw } from 'lucide-react';
import './App.css';

function App() {
  const [mode, setMode] = useState('form');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [fields, setFields] = useState(() => {
    const saved = localStorage.getItem('pdfFields');
    return saved ? JSON.parse(saved) : defaultFields;
  });

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-mode' : '';
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check if we need to force mapper mode on first load
  useEffect(() => {
    if (fields.length === 0) {
      setMode('mapper');
    }
  }, []);

  const handleSaveFields = (newFields) => {
    setFields(newFields);
    localStorage.setItem('pdfFields', JSON.stringify(newFields));
    setMode('form');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleResetFields = () => {
    if (confirm('¿Estás seguro de que quieres restablecer todos los campos a los valores predeterminados? Se perderán tus ajustes actuales.')) {
      localStorage.removeItem('pdfFields');
      setFields(defaultFields);
      // Small trick to force state refresh if needed, although setFields should be enough
      window.location.reload(); 
    }
  };

  return (
    <div className={`app-container ${theme}-theme`}>
      <header className="main-header">
        <div className="header-content">
          <h1>Generador Formato FOMAG</h1>
          <div className="header-actions">
            <button 
              className="btn-icon theme-toggle" 
              onClick={handleResetFields}
              title="Restablecer campos predeterminados"
            >
              <RotateCcw size={20} />
            </button>
            <button className="btn-icon theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {mode === 'mapper' ? (
          <PdfMapper 
            onSave={handleSaveFields} 
            initialFields={fields}
            onCancel={() => setMode('form')}
          />
        ) : (
          <PdfForm 
            fields={fields} 
            onEdit={() => setMode('mapper')} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
