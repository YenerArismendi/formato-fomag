
import { useState, useEffect } from 'react';
import PdfMapper from './components/PdfMapper';
import PdfForm from './components/PdfForm';
import { defaultFields } from './data/defaultFields';
import { Sun, Moon } from 'lucide-react';
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

  return (
    <div className={`app-container ${theme}-theme`}>
      <header className="main-header">
        <div className="header-content">
          <h1>Generador Formato FOMAG</h1>
          <button className="btn-icon theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
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
