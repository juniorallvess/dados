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
 * Normaliza uma string para comparação: 
 * Remove acentos, pontuação, espaços e deixa tudo minúsculo.
 * Isso garante que "JOÃO", "Joao", " João " e "J.O.A.O" sejam considerados iguais.
 */
export const normalizeKey = (val) => {
  if (val === undefined || val === null) return '';
  return String(val)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9]/g, '') // Remove espaços, pontuação, hífens, etc.
    .toLowerCase();
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
      key = Object.values(rest).map(normalizeKey).join('|');
    } else {
      key = normalizeKey(row[duplicateColumn]);
    }
    
    // Ignora chaves vazias

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
    const key = normalizeKey(row[colB]);
    if (key !== '') {
      keysInB.add(key);
    }
  });

  return dataA.map(row => {
    const key = normalizeKey(row[colA]);
    return {
      ...row,
      _encontrado: (key !== '' && keysInB.has(key)) ? 'Sim' : 'Não'
    };
  });
};

/**
 * Retorna a Planilha de Referência (dataB) excluindo as linhas que possuem correspondência 
 * na Planilha Principal (dataA), ou seja, subtraindo os duplicados.
 */
export const getUnmatchedReference = (dataA, colA, dataB, colB) => {
  const keysInA = new Set();
  
  dataA.forEach(row => {
    const key = normalizeKey(row[colA]);
    if (key !== '') {
      keysInA.add(key);
    }
  });

  const seenInB = new Set();

  return dataB.filter(row => {
    const key = normalizeKey(row[colB]);
    
    // Se a chave estiver vazia, mantemos a linha e não filtramos
    if (key === '') return true;

    // Se já vimos essa chave dentro da PRÓPRIA Planilha B (duplicidade interna), excluímos
    if (seenInB.has(key)) return false;

    // Se a chave existe na Planilha A, excluímos (cruzamento)
    if (keysInA.has(key)) return false;

    // Marca como vista na Planilha B para as próximas linhas
    seenInB.add(key);
    
    return true;
  });
};

/**
 * Retorna a Planilha de Referência (dataB) contendo APENAS as linhas que POSSUEM correspondência
 * na Planilha Principal (dataA).
 */
export const getMatchedReference = (dataA, colA, dataB, colB) => {
  const keysInA = new Set();
  
  dataA.forEach(row => {
    const key = normalizeKey(row[colA]);
    if (key !== '') {
      keysInA.add(key);
    }
  });

  const seenInB = new Set();

  return dataB.filter(row => {
    const key = normalizeKey(row[colB]);
    
    // Se a chave estiver vazia, ignoramos
    if (key === '') return false;

    // Se já vimos, removemos (duplicidade interna)
    if (seenInB.has(key)) return false;

    // Se a chave NÃO existe na Planilha A, excluímos (queremos apenas os que deram match)
    if (!keysInA.has(key)) return false;

    // Marca como vista na Planilha B para as próximas linhas
    seenInB.add(key);
    
    return true;
  });
};
