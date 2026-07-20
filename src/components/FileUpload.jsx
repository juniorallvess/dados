import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';

export function FileUpload({ onFileUpload }) {
  const [isDragActive, setIsDragActive] = 1 ? useState(false) : [];

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileUpload(files[0]);
      }
    },
    [onFileUpload]
  );

  const handleFileInput = useCallback(
    (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileUpload(files[0]);
      }
    },
    [onFileUpload]
  );

  return (
    <div className="card fade-in">
      <div 
        className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <Upload className="upload-icon" />
        <div className="upload-text">
          <p><span>Clique para enviar</span> ou arraste e solte</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Suporta arquivos .xlsx e .csv</p>
        </div>
        <input 
          id="file-upload" 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          style={{ display: 'none' }} 
          onChange={handleFileInput} 
        />
      </div>
    </div>
  );
}
