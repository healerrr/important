import * as XLSX from '@e965/xlsx';
import { parseExcel, parseOwnerNames, parseProgress } from '../src/modules/imports/excel.parser';

describe('Excel parser', () => {
  it.each([
    [72, 72],
    ['72%', 72],
    [0.72, 72],
    [100, 100],
    [0, 0],
  ])('parses %p as %p', (input, expected) => expect(parseProgress(input)).toBe(expected));
  it('rejects out-of-range progress', () => {
    expect(parseProgress(-1)).toBeNull();
    expect(parseProgress(101)).toBeNull();
  });
  it('splits and de-duplicates multiple owner names', () => {
    expect(parseOwnerNames('李红、袁志刚，李红; 王芳\n王辉1/王辉2')).toEqual([
      '李红',
      '袁志刚',
      '王芳',
      '王辉1',
      '王辉2',
    ]);
  });
  it('maps aliases, ignores blank rows and collects all row errors', () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ['项目', '目标', '项目负责人', '进度'],
      ['A', '目标A', '张伟', '72%'],
      ['', '', '', ''],
      ['', '', '', 120],
      ['B', '', '', -1],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, '项目');
    const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
    const parsed = parseExcel(Buffer.from(output), 2000);
    expect(parsed.rows[0]).toMatchObject({ row: 2, name: 'A', progress: 72 });
    expect(parsed.errors).toHaveLength(3);
  });

  it.each(['IT人员', 'IT 人员'])('maps the %s column to the project owner', (ownerHeader) => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ['标题', '需求', '状态', ownerHeader, '需求部门'],
      ['A', '目标A', '进行中', '李红、袁志刚', '业务部'],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, '项目');
    const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as Uint8Array;

    const parsed = parseExcel(Buffer.from(output), 2000);

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]).toMatchObject({
      row: 2,
      name: 'A',
      ownerNames: ['李红', '袁志刚'],
    });
  });
});
