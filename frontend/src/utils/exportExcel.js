import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4C81' } };
const OPHEAD_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
const WHITE_BOLD = { color: { argb: 'FFFFFFFF' }, bold: true, size: 9 };

export async function exportInspectionToExcel(entry) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'QualityOS';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('IPIR', { views: [{ state: 'frozen', ySplit: 2 }] });

  const shifts = entry.template?.shifts || [{ code: entry.shift, label: `Shift ${entry.shift}` }];
  const baseCols = ['OP No.', 'Process', 'SI', 'Parameter', 'Specification', 'Method'];
  const shiftCols = shifts.flatMap((s) => [`${s.code} - OK`, `${s.code} - NOK`, `${s.code} - CA`]);
  const header = [...baseCols, ...shiftCols, 'Remarks / CA'];

  sheet.addRow([`In-Process Inspection Report (IPIR) - ${entry.reportId}`]);
  sheet.mergeCells(1, 1, 1, header.length);
  sheet.getRow(1).font = { bold: true, size: 13, color: { argb: 'FF0F4C81' } };

  sheet.addRow([]);
  const metaRow = sheet.addRow([
    'Customer', entry.customer?.name, 'Line', entry.productionLine?.name, 'Model', entry.model?.name,
    'Date', new Date(entry.date).toLocaleDateString('en-IN'),
  ]);
  metaRow.font = { size: 10 };

  sheet.addRow([]);
  const headerRow = sheet.addRow(header);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = WHITE_BOLD;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  sheet.columns = header.map((h) => ({ width: h === 'Parameter' || h === 'Specification' ? 20 : h === 'Remarks / CA' ? 26 : 12 }));

  let currentOp = null;
  entry.results.forEach((row) => {
    const opKey = `${row.opNumber}-${row.operationName}`;
    if (opKey !== currentOp) {
      currentOp = opKey;
      const opRow = sheet.addRow([`OP ${row.opNumber} \u00b7 ${row.operationName}`]);
      sheet.mergeCells(opRow.number, 1, opRow.number, header.length);
      opRow.eachCell((c) => { c.fill = OPHEAD_FILL; c.font = { bold: true, color: { argb: 'FF0F4C81' }, size: 10 }; });
    }

    const shiftCells = shifts.flatMap((s) => {
      const cell = row.shiftResults.find((r) => r.shiftCode === s.code);
      const v = cell?.value;
      return [v === 'OK' ? '\u2713' : '', v === 'NOK' ? '\u2717' : '', v === 'CA' ? '\u26a0' : ''];
    });

    const dataRow = sheet.addRow([
      row.opNumber,
      row.processName,
      row.siNo,
      row.parameterName,
      row.specification,
      row.method,
      ...shiftCells,
      row.nonConformity ? `${row.nonConformity.ncId || 'NC'} \u2014 ${row.remarks || ''}` : row.remarks,
    ]);
    dataRow.font = { size: 10 };
    dataRow.alignment = { vertical: 'middle' };

    const hasOpenNC = row.nonConformity && row.nonConformity.status !== 'Closed';
    if (hasOpenNC) {
      dataRow.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5F5' } }; });
    }
  });

  sheet.addRow([]);
  const summary = entry.summary || {};
  sheet.addRow(['Total Parameters', summary.totalParameters, 'Total NC', summary.totalNC, 'Corrective Actions', summary.correctiveActions, 'Quality %', `${summary.qualityPercent}%`]).font = { bold: true, size: 10 };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${entry.reportId}.xlsx`);
}

export async function exportDashboardToExcel({ overview, lines, trend, status, recentNC, topDefects, log, shift }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'QualityOS';
  workbook.created = new Date();

  const overviewSheet = workbook.addWorksheet('Overview');
  overviewSheet.addRows([
    ['QualityOS Dashboard'],
    ['Generated', new Date()],
    ['Shift', shift],
    [],
    ['Metric', 'Value'],
    ['Production Lines', overview.productionLines],
    ['Active Lines', overview.activeLines],
    ['Overall Quality %', overview.overallQualityPercent],
    ['Pending Inspections', overview.pendingInspections],
    ['NCs Today', overview.ncCountToday],
    ['Critical NCs Today', overview.ncCriticalToday],
    ['Completed This Shift', status?.completed ?? ''],
    ['In Progress This Shift', status?.inProgress ?? ''],
    ['Pending Review This Shift', status?.pending ?? ''],
  ]);
  overviewSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF0F4C81' } };
  overviewSheet.getRow(5).font = { bold: true };
  overviewSheet.columns = [{ width: 30 }, { width: 28 }];

  const addTable = (name, headers, rows) => {
    const sheet = workbook.addWorksheet(name);
    const header = sheet.addRow(headers);
    header.eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = WHITE_BOLD;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
    rows.forEach((row) => sheet.addRow(row));
    sheet.columns = headers.map((label) => ({
      width: label.length > 18 ? 24 : 16,
    }));
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    return sheet;
  };

  addTable('Line Status', ['Production Line', 'Model', 'Status', 'Shift', 'Quality %', 'Auditor', 'Report ID'], lines.map((line) => [
    line.line, line.model, line.status, line.shift || '', line.qualityPercent ?? '', line.Auditor || '', line.reportId || '',
  ]));
  addTable('Quality Trend', ['Date', 'Quality %'], trend.map((day) => [day.date, day.qualityPercent ?? '']));
  addTable('Recent NCs', ['NC ID', 'Line', 'Model', 'Operation', 'Parameter', 'Actual Value', 'Status'], recentNC.map((nc) => [
    nc.ncId, nc.line, nc.model, nc.operation, nc.parameter, nc.actualValue || '', nc.status,
  ]));
  addTable('Inspection Log', ['Report ID', 'Line', 'Model', 'Shift', 'Auditor', 'Time', 'Quality %', 'NCs', 'Status'], log.map((entry) => [
    entry.reportId, entry.line, entry.model, entry.shift, entry.Auditor, entry.time, entry.qualityPercent, entry.ncCount, entry.status,
  ]));
  addTable('Top Defects', ['Parameter', 'Count', '% of Maximum'], topDefects.map((defect) => [
    defect.label, defect.count, defect.percentOfMax,
  ]));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `QualityOS-Dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
