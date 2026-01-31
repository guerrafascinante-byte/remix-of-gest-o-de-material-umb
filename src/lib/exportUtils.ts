import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportOptions {
  filename: string;
  title: string;
  filters?: Record<string, string>;
  data: any[];
  columns: ExportColumn[];
}

export const exportToExcel = async (options: ExportOptions): Promise<void> => {
  const { filename, title, filters, data, columns } = options;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Dados');

  // Adicionar título
  worksheet.addRow([title]);
  worksheet.addRow([`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`]);

  // Adicionar filtros aplicados
  if (filters && Object.keys(filters).length > 0) {
    const filterText = Object.entries(filters)
      .filter(([_, value]) => value && value !== 'Todos')
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
    if (filterText) {
      worksheet.addRow([`Filtros: ${filterText}`]);
    }
  }

  // Linha em branco
  worksheet.addRow([]);

  // Adicionar cabeçalhos da tabela
  const headers = columns.map(col => col.header);
  const headerRow = worksheet.addRow(headers);
  
  // Estilizar cabeçalhos
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  // Adicionar dados
  data.forEach(item => {
    const rowData = columns.map(col => {
      const value = item[col.key];
      if (typeof value === 'number') {
        return value;
      }
      return value ?? '';
    });
    worksheet.addRow(rowData);
  });

  // Definir larguras das colunas
  worksheet.columns = columns.map((col, index) => ({
    key: `col${index}`,
    width: col.width || 15
  }));

  // Gerar buffer e baixar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = async (options: ExportOptions): Promise<void> => {
  const { filename, title, filters, data, columns } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 15);

  // Data de geração
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 22);

  // Filtros aplicados
  let startY = 28;
  if (filters && Object.keys(filters).length > 0) {
    const filterText = Object.entries(filters)
      .filter(([_, value]) => value && value !== 'Todos')
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
    if (filterText) {
      doc.setFontSize(9);
      doc.text(`Filtros: ${filterText}`, 14, startY);
      startY += 6;
    }
  }

  // Tabela
  const headers = columns.map(col => col.header);
  const rows = data.map(item => columns.map(col => {
    const value = item[col.key];
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR');
    }
    return value ?? '';
  }));

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: startY + 2,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { left: 14, right: 14 },
  });

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Baixar arquivo
  doc.save(`${filename}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

export const exportToCSV = (options: ExportOptions): void => {
  const { filename, data, columns } = options;

  // Linhas do CSV - formato limpo para reimportação
  const lines: string[] = [];

  // Cabeçalhos (primeira linha)
  const headers = columns.map(col => col.header);
  lines.push(headers.join(';'));

  // Dados
  data.forEach(item => {
    const rowData = columns.map(col => {
      const value = item[col.key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') {
        return String(value); // Números sem formatação para compatibilidade
      }
      // Escapar aspas duplas e envolver em aspas se necessário
      const strValue = String(value);
      if (strValue.includes(';') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    });
    lines.push(rowData.join(';'));
  });

  // Gerar conteúdo CSV com BOM para UTF-8
  const BOM = '\uFEFF';
  const csvContent = BOM + lines.join('\r\n');

  // Criar blob e baixar
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Colunas padrão para exportação de reservas
export const reservasColumns: ExportColumn[] = [
  { header: 'Nº Reserva', key: 'numero_reserva', width: 15 },
  { header: 'Código', key: 'material_codigo', width: 12 },
  { header: 'Material', key: 'material_nome', width: 35 },
  { header: 'Liberado', key: 'quantidade_liberada', width: 12 },
  { header: 'Utilizado', key: 'quantidade_utilizada', width: 12 },
  { header: 'Saldo', key: 'saldo', width: 10 },
  { header: 'Localidade', key: 'localidade', width: 12 },
  { header: 'Status', key: 'status', width: 12 },
];

// Colunas padrão para exportação de materiais em estoque (compatível com importação)
export const materiaisColumns: ExportColumn[] = [
  { header: 'Código SAP', key: 'material_codigo', width: 12 },
  { header: 'Nome material', key: 'material_nome', width: 40 },
  { header: 'Quantidade', key: 'total_liberado', width: 15 },
  { header: 'Quantidade Utilizada', key: 'total_utilizado', width: 15 },
  { header: 'Saldo', key: 'saldo', width: 12 },
];

// Colunas padrão para exportação de divergências
export const divergenciasColumns: ExportColumn[] = [
  { header: 'Material', key: 'material', width: 40 },
  { header: 'Localidade', key: 'localidade', width: 12 },
  { header: 'Mês', key: 'mes', width: 10 },
  { header: 'Liberado', key: 'liberado', width: 12 },
  { header: 'Utilizado', key: 'utilizado', width: 12 },
  { header: 'Divergência', key: 'divergencia', width: 12 },
];
