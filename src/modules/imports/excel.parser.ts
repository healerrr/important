import * as XLSX from '@e965/xlsx';
import { ProjectStatus } from '../projects/dto/project.dto';

export interface ExcelRowError {
  row: number;
  field: string;
  message: string;
}
export interface ParsedProjectRow {
  row: number;
  name: string;
  annualGoal: string;
  department: string | null;
  status: ProjectStatus;
  ownerName: string | null;
  progress: number;
}

const aliases = {
  name: ['项目名称', '项目', '标题'],
  annualGoal: ['年度目标', '项目目标', '目标', '需求'],
  department: ['需求部门', '部门'],
  status: ['状态', '项目状态'],
  ownerName: ['负责人', '项目负责人', 'IT 人员', 'IT 人员', 'IT 人员', 'IT 人员', 'IT 人员'],
  progress: ['当前进度', '项目进度', '进度'],
} as const;

const statusMap: Record<string, ProjectStatus> = {
  未启动: ProjectStatus.NOT_STARTED,
  待启动: ProjectStatus.NOT_STARTED,
  进行中: ProjectStatus.IN_PROGRESS,
  已启动: ProjectStatus.IN_PROGRESS,
  已完成: ProjectStatus.COMPLETED,
  已暂停: ProjectStatus.PAUSED,
  暂停: ProjectStatus.PAUSED,
  已取消: ProjectStatus.CANCELLED,
  取消: ProjectStatus.CANCELLED,
};

export function parseProgress(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return 0;
  let n: number;
  if (typeof value === 'number') n = value >= 0 && value <= 1 ? value * 100 : value;
  else if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return 0;
    const percent = text.endsWith('%');
    n = Number(percent ? text.slice(0, -1).trim() : text);
  } else return null;
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n);
}

export function parseStatus(value: unknown): ProjectStatus {
  if (value === null || value === undefined || value === '') return ProjectStatus.NOT_STARTED;
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return ProjectStatus.NOT_STARTED;
    if (statusMap[text]) return statusMap[text];
  }
  // 未知状态值默认使用 NOT_STARTED
  return ProjectStatus.NOT_STARTED;
}

export function parseExcel(
  buffer: Buffer,
  maxRows: number,
): { rows: ParsedProjectRow[]; errors: ExcelRowError[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellFormula: false, bookVBA: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName)
    return { rows: [], errors: [{ row: 1, field: '文件', message: 'Excel 中没有工作表' }] };
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
    blankrows: true,
    defval: '',
  });
  if (!matrix.length)
    return { rows: [], errors: [{ row: 1, field: '文件', message: 'Excel 内容为空' }] };
  const cellText = (value: unknown): string => {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
    if (value instanceof Date) return value.toISOString();
    return '';
  };
  const headers = matrix[0].map(cellText);
  console.log('Excel headers:', headers);
  console.log('Excel headers (hex):', headers.map(h => Buffer.from(h).toString('hex')));
  console.log('ownerName aliases:', aliases.ownerName);
  console.log('ownerName aliases (hex):', aliases.ownerName.map(a => Buffer.from(a).toString('hex')));
  const index = Object.fromEntries(
    Object.entries(aliases).map(([key, names]) => [
      key,
      headers.findIndex((h) => (names as readonly string[]).includes(h)),
    ]),
  ) as Record<keyof typeof aliases, number>;
  console.log('Column index mapping:', index);
  if (index.name < 0)
    return {
      rows: [],
      errors: [
        { row: 1, field: '项目名称', message: '缺少项目名称表头（支持"项目名称"/"项目"/"标题"）' },
      ],
    };

  const rows: ParsedProjectRow[] = [];
  const errors: ExcelRowError[] = [];
  const names = new Map<string, number>();
  for (let i = 1; i < matrix.length; i += 1) {
    const cells = matrix[i];
    if (!cells.some((v) => cellText(v) !== '')) continue;
    const row = i + 1;
    const text = (column: number): string => (column < 0 ? '' : cellText(cells[column]));
    const name = text(index.name);
    const annualGoal = text(index.annualGoal);
    const department = text(index.department) || null;
    const statusText = text(index.status);
    const status = statusText ? parseStatus(statusText) : ProjectStatus.NOT_STARTED;
    const ownerName = text(index.ownerName) || null;
    const progress = parseProgress(index.progress < 0 ? '' : cells[index.progress]);
    if (!name) errors.push({ row, field: '项目名称', message: '项目名称不能为空' });
    if (name.length > 200)
      errors.push({ row, field: '项目名称', message: '项目名称不能超过 200 个字符' });
    if (annualGoal.length > 2000)
      errors.push({ row, field: '年度目标', message: '年度目标不能超过 2000 个字符' });
    if (department && department.length > 100)
      errors.push({ row, field: '需求部门', message: '需求部门不能超过 100 个字符' });
    if (ownerName && ownerName.length > 50)
      errors.push({ row, field: '负责人', message: '负责人不能超过 50 个字符' });
    if (progress === null) errors.push({ row, field: '当前进度', message: '进度必须在 0 到 100 之间' });
    if (name) {
      const previous = names.get(name);
      if (previous)
        errors.push({ row, field: '项目名称', message: `与第${previous}行项目名称重复` });
      else names.set(name, row);
    }
    if (name && progress !== null)
      rows.push({ row, name, annualGoal, department, status, ownerName, progress });
  }
  if (rows.length > maxRows)
    errors.push({ row: 1, field: '文件', message: `有效数据行不能超过${maxRows}行` });
  if (!rows.length && !errors.length)
    errors.push({ row: 1, field: '文件', message: 'Excel 中没有有效数据行' });
  return { rows, errors };
}
