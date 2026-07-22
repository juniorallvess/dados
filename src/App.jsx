import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { CompareUpload } from './components/CompareUpload';
import { DataTable } from './components/DataTable';
import { parseFile, findDuplicates, exportFile, compareFiles, getUnmatchedReference, getMatchedReference } from './utils/spreadsheetHelpers';
import { Layers, Scissors, ArrowRightLeft, ChevronLeft, Download, CheckCircle } from 'lucide-react';

function App() {
  const [mode, setMode] = useState(null); // null | 'dedupe' | 'compare'
  const [step, setStep] = useState(0); // 0: upload, 1: config, 2: table
  const [showOptions, setShowOptions] = useState(false);
  
  // States comuns e Dedupe
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [duplicateColumn, setDuplicateColumn] = useState('ALL');
  
  // States para Comparação
  const [dataB, setDataB] = useState([]);
  const [columnsB, setColumnsB] = useState([]);
  const [compareColA, setCompareColA] = useState('');
  const [compareColB, setCompareColB] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selecionar Modo
  const handleSelectMode = (selectedMode) => {
    setMode(selectedMode);
    setStep(0);
    setError(null);
  };

  // Upload Dedupe
  const handleFileUpload = async (file) => {
    try {
      setLoading(true);
      setError(null);
      const result = await parseFile(file);
      
      if (result.data.length === 0) {
        setError('A planilha parece estar vazia.');
      } else {
        setData(result.data);
        setColumns(result.columns);
        setStep(1); // Vai para o passo de configuração
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao ler o arquivo. Certifique-se de que é um Excel ou CSV válido.');
    } finally {
      setLoading(false);
    }
  };

  // Upload Comparação
  const handleCompareUpload = async (fileA, fileB) => {
    try {
      setLoading(true);
      setError(null);
      const resA = await parseFile(fileA);
      const resB = await parseFile(fileB);
      
      if (resA.data.length === 0 || resB.data.length === 0) {
        setError('Uma das planilhas parece estar vazia.');
        return;
      }
      
      setData(resA.data);
      setColumns(resA.columns);
      setDataB(resB.data);
      setColumnsB(resB.columns);
      setCompareColA(resA.columns[0] || '');
      setCompareColB(resB.columns[0] || '');
      
      setStep(1);
    } catch (err) {
      console.error(err);
      setError('Erro ao ler arquivos. Certifique-se de que são planilhas válidas.');
    } finally {
      setLoading(false);
    }
  };

  // Recalcula as duplicidades para o modo dedupe
  useEffect(() => {
    if (mode === 'dedupe' && data.length > 0) {
      const dupes = findDuplicates(data, duplicateColumn);
      setDuplicates(dupes);
    }
  }, [data, duplicateColumn, mode]);

  // Derivação dos dados a exibir
  let dataToDisplay = data;
  let finalColumns = columns;
  let dataToDisplayB = dataB;
  let finalColumnsB = columnsB;
  let foundCount = 0;

  if (mode === 'dedupe') {
    // Agora mostramos todos os dados na tabela, a remoção ocorre apenas no momento da exportação
    dataToDisplay = data;
  } else if (mode === 'compare' && step === 2) {
    // Para modo comparação, geramos os dados comparados para a Tabela A
    dataToDisplay = compareFiles(data, compareColA, dataB, compareColB);
    if (!finalColumns.includes('_encontrado')) {
      finalColumns = ['_encontrado', ...columns];
    }
    foundCount = dataToDisplay.filter(row => row._encontrado === 'Sim').length;

    // Geramos os dados comparados para a Tabela B (referência)
    dataToDisplayB = compareFiles(dataB, compareColB, data, compareColA);
    if (!finalColumnsB.includes('_encontrado')) {
      finalColumnsB = ['_encontrado', ...columnsB];
    }
  }

  // Avança para a tabela
  const handleEvaluate = () => {
    setLoading(true);
    setTimeout(() => {
      setStep(2);
      setLoading(false);
    }, 300);
  };

  const handleExport = (dataToExport) => {
    exportFile(dataToExport, mode === 'dedupe' ? 'dados_limpos.xlsx' : 'dados_comparados.xlsx');
  };

  const handleExportReference = () => {
    const referenceData = getUnmatchedReference(data, compareColA, dataB, compareColB);
    exportFile(referenceData, 'referencia_NAO_encontrados.xlsx');
  };

  const handleExportMatchedReference = () => {
    const referenceData = getMatchedReference(data, compareColA, dataB, compareColB);
    exportFile(referenceData, 'referencia_APENAS_encontrados.xlsx');
  };

  const handleClear = () => {
    setData([]);
    setColumns([]);
    setDuplicates([]);
    setDataB([]);
    setColumnsB([]);
    setStep(0);
    setMode(null);
    setShowOptions(false);
    setError(null);
  };

  return (
    <div className="container">
      <header className="header" style={{ position: 'relative' }}>
        {mode && (
          <button 
            className="btn btn-outline" 
            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', padding: '0.5rem' }}
            onClick={handleClear}
            title="Voltar ao início"
          >
            <ChevronLeft size={24} /> Voltar
          </button>
        )}
        <h1>
          <Layers style={{ display: 'inline', marginRight: '10px', color: 'var(--primary-color)' }} size={40} />
          EasySheets
        </h1>
        <p>Detecte, limpe e compare dados em planilhas de forma fácil e rápida.</p>
      </header>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-color)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid #fca5a5' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Processando...
        </div>
      )}

      {/* TELA INICIAL (LANDING PAGE) */}
      {!loading && !mode && !showOptions && (
        <div className="fade-in" style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Bem-vindo ao EasySheets</h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
            A ferramenta definitiva para limpar, organizar e comparar suas planilhas em poucos cliques, sem enviar seus dados para nenhum servidor.
          </p>
          <button 
            className="btn btn-primary" 
            style={{ fontSize: '1.25rem', padding: '1rem 3rem', borderRadius: '50px' }}
            onClick={() => setShowOptions(true)}
          >
            Start
          </button>
        </div>
      )}

      {/* TELA INICIAL: SELEÇÃO DE MODO */}
      {!loading && !mode && showOptions && (
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
          <div className="card fade-in" style={{ flex: '1 1 300px', cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSelectMode('dedupe')}>
            <Scissors size={48} color="var(--primary-color)" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ marginBottom: '1rem' }}>Limpar Duplicidades</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Encontre e remova linhas repetidas em uma única planilha.</p>
          </div>
          
          <div className="card fade-in" style={{ flex: '1 1 300px', cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSelectMode('compare')}>
            <ArrowRightLeft size={48} color="var(--primary-color)" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ marginBottom: '1rem' }}>Comparar Planilhas</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Cruze dados entre duas planilhas para saber quem está em ambas.</p>
          </div>
        </div>
      )}

      {/* MODOS DE UPLOAD (STEP 0) */}
      {!loading && mode === 'dedupe' && step === 0 && (
        <FileUpload onFileUpload={handleFileUpload} />
      )}
      {!loading && mode === 'compare' && step === 0 && (
        <CompareUpload onFilesUpload={handleCompareUpload} />
      )}

      {/* CONFIGURAÇÃO DEDUPE (STEP 1) */}
      {!loading && mode === 'dedupe' && step === 1 && (
        <div className="card fade-in" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>Planilha carregada!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Encontramos <strong>{columns.length}</strong> colunas. Como você deseja procurar por duplicidades?
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
            <label style={{ fontWeight: 600 }}>Critério de Duplicidade:</label>
            <select 
              className="select-input" 
              value={duplicateColumn} 
              onChange={(e) => setDuplicateColumn(e.target.value)}
              style={{ padding: '0.75rem', fontSize: '1rem' }}
            >
              <option value="ALL">Analisar a linha inteira (Todos os campos idênticos)</option>
              {columns.map(col => (
                <option key={col} value={col}>Usar a coluna: {col}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={() => setStep(0)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleEvaluate}>Avaliar Planilha</button>
          </div>
        </div>
      )}

      {/* CONFIGURAÇÃO COMPARE (STEP 1) */}
      {!loading && mode === 'compare' && step === 1 && (
        <div className="card fade-in" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>Planilhas carregadas!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Escolha as colunas correspondentes para fazer a comparação (ex: 'CPF' na primeira e 'Documento' na segunda).
          </p>
          
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 250px', textAlign: 'left' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
                Chave da Planilha Principal:
              </label>
              <select 
                className="select-input" 
                value={compareColA} 
                onChange={(e) => setCompareColA(e.target.value)}
                style={{ padding: '0.75rem', fontSize: '1rem', width: '100%' }}
              >
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1 1 250px', textAlign: 'left' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
                Chave da Planilha de Referência:
              </label>
              <select 
                className="select-input" 
                value={compareColB} 
                onChange={(e) => setCompareColB(e.target.value)}
                style={{ padding: '0.75rem', fontSize: '1rem', width: '100%' }}
              >
                {columnsB.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={() => setStep(0)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleEvaluate}>Comparar Dados</button>
          </div>
        </div>
      )}

      {/* RESULTADOS (STEP 2) */}
      {!loading && step === 2 && (
        <>
          <div className="card fade-in" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            
            {mode === 'dedupe' && (
              <>
                <span style={{ fontWeight: 600 }}>Critério de Duplicidade:</span>
                <select 
                  className="select-input" 
                  value={duplicateColumn} 
                  onChange={(e) => setDuplicateColumn(e.target.value)}
                >
                  <option value="ALL">Linha Inteira (Todos os campos idênticos)</option>
                  {columns.map(col => (
                    <option key={col} value={col}>Coluna: {col}</option>
                  ))}
                </select>
                
                {duplicates.length > 0 && (
                  <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>
                    {duplicates.length} duplicidades encontradas
                  </span>
                )}
                {duplicates.length === 0 && (
                  <span className="badge" style={{ marginLeft: 'auto', backgroundColor: 'var(--success-color)', color: 'white' }}>
                    Nenhuma duplicidade!
                  </span>
                )}
              </>
            )}

            {mode === 'compare' && (
              <>
                <span style={{ fontWeight: 600 }}>Comparando:</span>
                <span style={{ color: 'var(--primary-color)' }}>{compareColA}</span>
                <ArrowRightLeft size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--primary-color)' }}>{compareColB}</span>
                
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', marginLeft: '1rem' }}
                  onClick={() => setStep(1)}
                >
                  Alterar Chaves
                </button>

                {foundCount > 0 ? (
                  <span className="badge" style={{ marginLeft: 'auto', backgroundColor: 'var(--success-color)', color: 'white' }}>
                    {foundCount} itens encontrados na outra planilha
                  </span>
                ) : (
                  <span className="badge badge-danger" style={{ marginLeft: 'auto', backgroundColor: 'var(--danger-color)', color: 'white' }}>
                    Nenhum cruzamento encontrado
                  </span>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--success-color)' }}
                    onClick={handleExportMatchedReference}
                  >
                    <CheckCircle size={16} /> Baixar Ref. ENCONTRADOS
                  </button>

                  <button 
                    className="btn btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={handleExportReference}
                  >
                    <Download size={16} /> Baixar Ref. NÃO ENCONTRADOS
                  </button>
                </div>
              </>
            )}

          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
            <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
              <DataTable 
                data={dataToDisplay}
                columns={finalColumns}
                duplicates={mode === 'dedupe' ? duplicates : []}
                onExport={(exportData) => exportFile(exportData, mode === 'dedupe' ? 'dados_limpos.xlsx' : 'planilha_principal_comparada.xlsx')}
                onClearData={handleClear}
                title={mode === 'compare' ? "Planilha Principal" : "Visualização de Dados"}
              />
            </div>
            
            {mode === 'compare' && (
              <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                <DataTable 
                  data={dataToDisplayB}
                  columns={finalColumnsB}
                  duplicates={[]}
                  onExport={(exportData) => exportFile(exportData, 'planilha_referencia_comparada.xlsx')}
                  onClearData={handleClear}
                  title="Planilha de Referência"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
