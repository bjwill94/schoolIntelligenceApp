import * as XLSX from 'xlsx';
import { SubjectItem, StudentItem } from '../types';
import { generateId } from '../data/seed';

export interface ParsedExamData {
  examName: string;
  subjects: SubjectItem[];
  students: StudentItem[];
  warnings: string[];
}

export async function parseFileToExamData(file: File): Promise<ParsedExamData> {
  const fileName = file.name.replace(/\.[^/.]+$/, '');
  const warnings: string[] = [];

  // Check if JSON file
  if (file.name.endsWith('.json')) {
    const text = await file.text();
    const json = JSON.parse(text);
    if (json.subjects && json.students) {
      return {
        examName: json.examName || fileName,
        subjects: json.subjects,
        students: json.students,
        warnings: [],
      };
    }
  }

  // Parse Excel or CSV using XLSX
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert worksheet to 2D array matrix
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rows.length === 0) {
    throw new Error('The uploaded file appears to be empty.');
  }

  // Find header row (first row with a column matching "name" or "student")
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (row.some((cell) => String(cell).toLowerCase().includes('name') || String(cell).toLowerCase().includes('student'))) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    headerRowIdx = 0; // Fallback to first row
  }

  const headerRow = rows[headerRowIdx];
  const dataRows = rows.slice(headerRowIdx + 1);

  let rollColIdx = -1;
  let nameColIdx = -1;
  const subjectColIndices: { index: number; rawHeader: string }[] = [];

  headerRow.forEach((cellVal, idx) => {
    const headerStr = String(cellVal).trim();
    if (!headerStr) return;

    const lower = headerStr.toLowerCase();
    if (rollColIdx === -1 && (lower.includes('s.no') || lower.includes('s. no') || lower.includes('roll') || lower.includes('sl.no') || lower === '#')) {
      rollColIdx = idx;
    } else if (nameColIdx === -1 && (lower.includes('name') || lower.includes('student'))) {
      nameColIdx = idx;
    } else if (idx !== rollColIdx && idx !== nameColIdx) {
      subjectColIndices.push({ index: idx, rawHeader: headerStr });
    }
  });

  if (nameColIdx === -1) {
    nameColIdx = 1; // Fallback to 2nd column
    warnings.push('Could not find explicit "Name of Student" column header; assuming Column 2.');
  }

  // Parse subjects and max marks (e.g., "ENG LANG(80)" or "PHYSICS (80)")
  const subjects: SubjectItem[] = subjectColIndices.map((col, idx) => {
    const raw = col.rawHeader;
    // Regex matches "SUBJECT NAME (80)" or "SUBJECT NAME [80]"
    const match = raw.match(/^(.+?)(?:\s*[\(\[](\d+)[\)\]])?$/);
    
    let name = raw;
    let max = 100;

    if (match) {
      name = match[1].trim();
      if (match[2]) {
        max = parseInt(match[2], 10);
      }
    }

    // Default pass marks to 33% of max marks (standard grading)
    const pass = Math.round(max * 0.33);

    return {
      id: generateId('sub'),
      name,
      max,
      pass,
    };
  });

  if (subjects.length === 0) {
    throw new Error('No subject columns were detected in the header row.');
  }

  // Parse student records
  let autoRollCounter = 1;
  const students: StudentItem[] = [];

  dataRows.forEach((row) => {
    const studentName = String(row[nameColIdx] || '').trim();
    if (!studentName) return; // Skip empty rows

    let rollVal = rollColIdx !== -1 ? row[rollColIdx] : autoRollCounter;
    let rollNum = parseInt(String(rollVal), 10);
    if (isNaN(rollNum)) {
      rollNum = autoRollCounter;
    }

    const marks: Record<string, number | string> = {};

    subjectColIndices.forEach((col, sIdx) => {
      const subId = subjects[sIdx].id;
      const rawVal = row[col.index];

      if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
        marks[subId] = 'NA'; // Optional subject or Not Applicable
      } else {
        const valStr = String(rawVal).trim().toUpperCase();
        if (valStr === 'AB' || valStr === 'ABSENT' || valStr === 'A') {
          marks[subId] = 'AB';
        } else {
          const num = parseFloat(valStr);
          if (!isNaN(num)) {
            marks[subId] = num;
          } else {
            marks[subId] = valStr;
          }
        }
      }
    });

    students.push({
      id: generateId('s'),
      roll: rollNum,
      name: studentName,
      marks,
    });

    autoRollCounter++;
  });

  if (students.length === 0) {
    warnings.push('No student rows were found below the header row.');
  }

  return {
    examName: fileName.replace(/[-_]/g, ' '),
    subjects,
    students,
    warnings,
  };
}
