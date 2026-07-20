import * as xlsx from 'xlsx';

/**
 * Lê o arquivo e retorna os dados em JSON e as colunas.
 */
export const parseFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = xlsx.read(data, { type: 'array' });
        
        // Pega a primeira aba da planilha
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converte para JSON
        const rawJsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
        
        // Remove linhas fantasmas (linhas onde todos os valores são vazios)
        const jsonData = rawJsonData.filter(row => 
          Object.values(row).some(val => String(val).trim() !== '')
        );
        
        if (jsonData.length === 0) {
          resolve({ data: [], columns: [] });
          return;
        }

        const columns = Object.keys(jsonData[0]);
        
        // Adiciona um ID único para cada linha para facilitar iteração no React
        const dataWithId = jsonData.map((row, index) => ({
          ...row,
          _id: index
        }));

        resolve({ data: dataWithId, columns });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Encontra duplicidades baseado em uma coluna específica ou na linha inteira.
 * Retorna os IDs das linhas que são duplicadas.
 */
export const findDuplicates = (data, duplicateColumn = 'ALL') => {
  const seen = new Map();
  const duplicates = new Set(); // Armazena os _ids das linhas duplicadas

  data.forEach((row) => {
    let key;
    
    if (duplicateColumn === 'ALL') {
      // Usamos os valores da linha (sem o _id) para criar uma chave única
      const { _id, ...rest } = row;
      key = JSON.stringify(rest);
    } else {
      key = row[duplicateColumn];
    }
    
    // Converte a chave para string para evitar problemas de tipo
    key = String(key).trim().toLowerCase();

    // Ignora chaves vazias (não considera células vazias como duplicadas entre si)
    if (key === '') return;

    if (seen.has(key)) {
      // Marca apenas as ocorrências extras como duplicadas (para serem "mortas")
      duplicates.add(row._id);
    } else {
      seen.set(key, row._id);
    }
  });

  return Array.from(duplicates);
};

/**
 * Exporta os dados fornecidos para um arquivo xlsx.
 */
export const exportFile = (data, filename = 'export.xlsx') => {
  // Remove o campo _id interno antes de exportar
  const cleanData = data.map(({ _id, ...rest }) => rest);
  
  const worksheet = xlsx.utils.json_to_sheet(cleanData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  xlsx.writeFile(workbook, filename);
};

/**
 * Compara dois conjuntos de dados e adiciona a coluna _encontrado no dataA
 */
export const compareFiles = (dataA, colA, dataB, colB) => {
  const keysInB = new Set();
  
  dataB.forEach(row => {
    const val = row[colB];
    if (val !== undefined && val !== null) {
      const strVal = String(val).trim().toLowerCase();
      if (strVal !== '') {
        keysInB.add(strVal);
      }
    }
  });

  return dataA.map(row => {
    const val = row[colA];
    const key = (val !== undefined && val !== null) ? String(val).trim().toLowerCase() : '';
    return {
      ...row,
      _encontrado: (key !== '' && keysInB.has(key)) ? 'Sim' : 'Não'
    };
  });
};
