import React, { useCallback, useState } from 'react';
import { Upload, ArrowRightLeft } from 'lucide-react';

export function CompareUpload({ onFilesUpload }) {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);

  const handleFileA = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) setFileA(files[0]);
  };

  const handleFileB = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) setFileB(files[0]);
  };

  const handleProceed = () => {
    if (fileA && fileB) {
      onFilesUpload(fileA, fileB);
    }
  };

  return (
    <div className="card fade-in" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Modo de Comparação</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Faça o upload de duas planilhas para verificar quais itens da <strong>Planilha Principal</strong> estão presentes na <strong>Planilha de Referência</strong>.
      </p>

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        
        {/* Upload Planilha A */}
        <div style={{ flex: '1 1 300px', padding: '2rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: fileA ? '#eff6ff' : 'var(--bg-color)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Planilha Principal</h3>
          {fileA ? (
            <div style={{ fontWeight: 600 }}>{fileA.name}</div>
          ) : (
            <>
              <Upload style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem auto' }} size={32} />
              <button className="btn btn-outline" onClick={() => document.getElementById('upload-a').click()}>
                Selecionar Arquivo
              </button>
            </>
          )}
          <input id="upload-a" type="file" accept=".xlsx, .csv" style={{ display: 'none' }} onChange={handleFileA} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
          <ArrowRightLeft size={32} />
        </div>

        {/* Upload Planilha B */}
        <div style={{ flex: '1 1 300px', padding: '2rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: fileB ? '#eff6ff' : 'var(--bg-color)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Planilha de Referência</h3>
          {fileB ? (
            <div style={{ fontWeight: 600 }}>{fileB.name}</div>
          ) : (
            <>
              <Upload style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem auto' }} size={32} />
              <button className="btn btn-outline" onClick={() => document.getElementById('upload-b').click()}>
                Selecionar Arquivo
              </button>
            </>
          )}
          <input id="upload-b" type="file" accept=".xlsx, .csv" style={{ display: 'none' }} onChange={handleFileB} />
        </div>

      </div>

      <button 
        className="btn btn-primary" 
        style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}
        disabled={!fileA || !fileB}
        onClick={handleProceed}
      >
        Prosseguir com os Arquivos
      </button>
    </div>
  );
}
