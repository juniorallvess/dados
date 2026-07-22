import React, { useState, useMemo } from 'react';
import { Download, CheckSquare, Square, Trash2 } from 'lucide-react';

export function DataTable({ data, columns, duplicates, onExport, onClearData, title = "Visualização de Dados" }) {
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Atualiza os filtros
  const handleFilterChange = (column, value) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
    setCurrentPage(1); // Resetar para página 1 ao filtrar
  };

  // Dados filtrados com base no input do usuário
  const filteredData = useMemo(() => {
    return data.filter(row => {
      return columns.every(col => {
        const filterVal = filters[col];
        if (!filterVal) return true;
        
        const cellVal = String(row[col] || '').toLowerCase();
        return cellVal.includes(filterVal.toLowerCase());
      });
    });
  }, [data, columns, filters]);

  // Paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const validCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  
  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, validCurrentPage, itemsPerPage]);

  // Lida com seleção individual
  const toggleSelection = (id) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  // Lida com seleção global (selecionar todos os filtrados)
  const isAllSelected = filteredData.length > 0 && filteredData.every(row => selectedIds.has(row._id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Limpar todos os filtrados da seleção
      const newSelection = new Set(selectedIds);
      filteredData.forEach(row => newSelection.delete(row._id));
      setSelectedIds(newSelection);
    } else {
      // Adicionar todos os filtrados à seleção
      const newSelection = new Set(selectedIds);
      filteredData.forEach(row => newSelection.add(row._id));
      setSelectedIds(newSelection);
    }
  };

  // Função para lidar com a exportação
  const handleExport = () => {
    // Se há seleções ativas, exportamos apenas as seleções que também estão no filtro atual
    // Se não há seleções, exportamos os filtrados
    let dataToExport = [];
    
    // Remove as duplicidades (linhas vermelhas) do export
    const dataWithoutDuplicates = filteredData.filter(row => !duplicates.includes(row._id));
    
    if (selectedIds.size > 0) {
      dataToExport = dataWithoutDuplicates.filter(row => selectedIds.has(row._id));
    } else {
      dataToExport = dataWithoutDuplicates;
    }
    
    if (dataToExport.length === 0) {
      alert("Nenhum dado para exportar com os filtros atuais.");
      return;
    }

    onExport(dataToExport);
  };

  return (
    <div className="card fade-in" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="table-actions">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{title}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {filteredData.length} registros encontrados • {selectedIds.size} selecionados
          </p>
        </div>
        
        <div className="controls-group">
          <button className="btn btn-outline" onClick={onClearData} style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>
            <Trash2 size={16} /> Limpar
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={16} /> Exportar {selectedIds.size > 0 ? 'Selecionados' : 'Filtrados'}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              {columns.map(col => (
                <th key={col}>
                  {col}
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Filtrar..."
                    value={filters[col] || ''}
                    onChange={(e) => handleFilterChange(col, e.target.value)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>
                  Nenhum dado encontrado para os filtros atuais.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const isDuplicate = duplicates.includes(row._id);
                return (
                  <tr key={row._id} className={isDuplicate ? 'duplicate' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        checked={selectedIds.has(row._id)}
                        onChange={() => toggleSelection(row._id)}
                      />
                    </td>
                    {columns.map(col => (
                      <td key={col}>{row[col]}</td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
        <button 
          className="btn btn-outline" 
          disabled={validCurrentPage === 1}
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
        >
          Anterior
        </button>
        
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Página <strong style={{ color: 'var(--text-primary)' }}>{validCurrentPage}</strong> de {Math.max(1, totalPages)}
        </span>
        
        <button 
          className="btn btn-outline" 
          disabled={validCurrentPage === totalPages || totalPages <= 1}
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
