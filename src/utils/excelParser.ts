import * as XLSX from 'xlsx';
import { SubjectItem, StudentItem } from '../types';
import { generateId } from '../data/seed';

export interface ParsedExamData {
  examName: string;
  subjects: SubjectItem[];
  students: StudentItem[];
  warnings: string[];
}

// Headers that must NEVER be treated as academic subjects
const NON_SUBJECT_PATTERNS: RegExp[] = [
  // Totals & Averages
  /^tot(al)?(\s+marks?)?$/i,
  /^grand\s+total$/i,
  /^sum$/i,
  /^(class\s+)?avg|average$/i,
  /^pct|percent(age)?$/i,
  /^%$/,
  // Rankings, Grades & Results
  /^rank$/i,
  /^pos(ition)?$/i,
  /^result$/i,
  /^status$/i,
  /^division|div$/i,
  /^grade$/i,
  /^gpa|cgpa$/i,
  // Metadata & Identifiers
  /^adm(ission)?(\s*no|\s*number)?$/i,
  /^reg(istration)?(\s*no|\s*number)?$/i,
  /^enroll(ment)?(\s*no|\s*number)?$/i,
  /^s\.?no\.?$|^sl\.?no\.?$|^#$/i,
  /^roll(\s*no|\s*number)?$/i,
  /^student(\s*name)?$/i,
  /^name(\s*of\s*student)?$/i,
  /^first\s*name$/i,
  /^last\s*name$/i,
  /^dob|date\s*of\s*birth$/i,
  /^gender|sex$/i,
  /^category$/i,
  /^house$/i,
  /^section|sec$/i,
  /^class|std$/i,
  /^attendance|att(\s*%)?$/i,
  /^remarks?|comments?$/i,
];

// Summary / Footer rows at the bottom of school registers that must not become fake students
const SUMMARY_ROW_PATTERNS: RegExp[] = [
  /^total(\s+marks?)?$/i,
  /^grand\s+total$/i,
  /^average|avg$/i,
  /^class\s+average$/i,
  /^pass(ed)?(\s+count|\s+students?)?$/i,
  /^fail(ed)?(\s+count|\s+students?)?$/i,
  /^highest(\s+marks?)?$/i,
  /^lowest(\s+marks?)?$/i,
  /^max(imum)?$/i,
  /^min(imum)?$/i,
  /^percentage|percent$/i,
  /^signature(\s+of.*)?$/i,
  /^class\s+teacher/i,
  /^principal/i,
  /^headmaster/i,
  /^checked\s+by/i,
  /^verified\s+by/i,
  /^examiner/i,
];

// Excel formula error strings
const EXCEL_ERRORS = new Set([
  '#VALUE!',
  '#REF!',
  '#DIV/0!',
  '#N/A',
  '#NUM!',
  '#NAME?',
  '#NULL!',
  'NULL',
  'UNDEFINED',
  'NAN',
]);

/**
 * Parses an Excel (.xlsx, .xls), CSV, or JSON file into clean Exam subjects and student marks.
 * Discards non-subject columns (TOTAL, PERCENTAGE, RANK), strips footer summary rows,
 * and validates marks without corrupting data.
 */
export async function parseFileToExamData(file: File): Promise<ParsedExamData> {
  const fileName = file.name.replace(/\.[^/.]+$/, '');
  const warnings: string[] = [];

  // 1. JSON file support
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

  // 2. Parse Excel/CSV via SheetJS
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert worksheet to 2D array
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rows.length === 0) {
    throw new Error('The uploaded file appears to be completely empty.');
  }

  // 3. Detect the header row (look for "Name", "Student", "Roll", etc.)
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i];
    const hasName = row.some((cell) => {
      const s = String(cell).toLowerCase();
      return s.includes('name') || s.includes('student');
    });
    if (hasName) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    headerRowIdx = 0; // Default to first row
  }

  const headerRow = rows[headerRowIdx];
  const dataRows = rows.slice(headerRowIdx + 1);

  let rollColIdx = -1;
  let nameColIdx = -1;
  const rawSubjectCols: { index: number; rawHeader: string }[] = [];

  // 4. Categorize columns
  headerRow.forEach((cellVal, idx) => {
    const headerStr = String(cellVal).trim();
    if (!headerStr) return;

    const lower = headerStr.toLowerCase();

    // Check if Roll No column
    if (
      rollColIdx === -1 &&
      (lower.includes('s.no') ||
        lower.includes('s. no') ||
        lower.includes('roll') ||
        lower.includes('sl.no') ||
        lower === '#' ||
        lower === 'r.no')
    ) {
      rollColIdx = idx;
      return;
    }

    // Check if Student Name column
    if (nameColIdx === -1 && (lower.includes('name') || lower.includes('student'))) {
      nameColIdx = idx;
      return;
    }

    // Check if column is a known non-subject (Total, Average, Rank, Result, etc.)
    const isNonSubject = NON_SUBJECT_PATTERNS.some((pat) => pat.test(headerStr));
    if (isNonSubject) {
      warnings.push(`Ignored non-subject column: "${headerStr}"`);
      return;
    }

    // Candidate subject column
    rawSubjectCols.push({ index: idx, rawHeader: headerStr });
  });

  if (nameColIdx === -1) {
    nameColIdx = rollColIdx === 0 ? 1 : 0;
    warnings.push('Could not find explicit "Name" header; assumed column index ' + (nameColIdx + 1));
  }

  if (rawSubjectCols.length === 0) {
    throw new Error('No valid subject columns were detected. Please ensure subjects are named in the header row.');
  }

  // 5. Pre-parse subjects and detect Max Marks
  const subjects: SubjectItem[] = rawSubjectCols.map((col) => {
    const raw = col.rawHeader;

    // Matches formats: "ENGLISH (80)", "MATHS [100]", "PHYSICS / 70", "CHEMISTRY - 70", "HINDI: 50"
    const match = raw.match(/^(.+?)(?:[\s\(\[\/\-:]+(?:max[\s:]*)?(\d+)[\)\]]?)?$/i);

    let name = raw;
    let max = 100;

    if (match) {
      name = match[1].replace(/[\(\[\/\-:]+$/, '').trim();
      if (match[2]) {
        const parsedMax = parseInt(match[2], 10);
        if (parsedMax > 0) {
          max = parsedMax;
        }
      }
    }

    const pass = Math.round(max * 0.33);

    return {
      id: generateId('sub'),
      name,
      max,
      pass,
    };
  });

  // 6. Extract student records & sanitize marks
  let autoRollCounter = 1;
  const students: StudentItem[] = [];

  for (const row of dataRows) {
    const rawName = String(row[nameColIdx] || '').trim();
    if (!rawName) continue; // Skip blank rows

    // Check if this row is a summary/footer row (e.g. "Total", "Average", "Class Average", "Signature")
    const isSummaryRow = SUMMARY_ROW_PATTERNS.some((pat) => pat.test(rawName));
    if (isSummaryRow) {
      continue; // Silently drop footer summary rows
    }

    // Parse roll number
    let rollNum = autoRollCounter;
    if (rollColIdx !== -1) {
      const parsedRoll = parseInt(String(row[rollColIdx]), 10);
      if (!isNaN(parsedRoll) && parsedRoll > 0) {
        rollNum = parsedRoll;
      }
    }

    // Process marks for each subject
    const marks: Record<string, number | string> = {};
    let hasAtLeastOneValidMark = false;

    rawSubjectCols.forEach((col, sIdx) => {
      const sub = subjects[sIdx];
      const rawCell = row[col.index];

      if (rawCell === undefined || rawCell === null || String(rawCell).trim() === '') {
        marks[sub.id] = 'NA'; // Missing or optional subject
        return;
      }

      const strVal = String(rawCell).trim().toUpperCase();

      // Check for Excel errors (#VALUE!, #DIV/0!, etc.)
      if (EXCEL_ERRORS.has(strVal)) {
        marks[sub.id] = 'NA';
        return;
      }

      // Check for Absence
      if (strVal === 'AB' || strVal === 'ABS' || strVal === 'ABSENT' || strVal === 'A') {
        marks[sub.id] = 'AB';
        hasAtLeastOneValidMark = true;
        return;
      }

      // Check for Exemption / Not Applicable
      if (
        strVal === 'NA' ||
        strVal === 'N/A' ||
        strVal === 'N.A.' ||
        strVal === '-' ||
        strVal === '—' ||
        strVal === 'EXEMPT' ||
        strVal === 'NIL'
      ) {
        marks[sub.id] = 'NA';
        return;
      }

      // Parse numeric mark
      const num = parseFloat(strVal);
      if (!isNaN(num)) {
        const cleanScore = Math.max(0, Math.round(num * 100) / 100);
        marks[sub.id] = cleanScore;
        hasAtLeastOneValidMark = true;

        // Auto-adjust subject max if student scored higher than initial max
        if (cleanScore > sub.max) {
          sub.max = Math.ceil(cleanScore / 10) * 10;
          sub.pass = Math.round(sub.max * 0.33);
        }
      } else {
        marks[sub.id] = 'NA';
      }
    });

    // Only add student if they have a reasonable name and at least some content
    students.push({
      id: generateId('s'),
      roll: rollNum,
      name: rawName,
      marks,
    });

    autoRollCounter++;
  }

  if (students.length === 0) {
    warnings.push('No valid student rows were extracted below the header.');
  }

  return {
    examName: fileName.replace(/[-_]/g, ' '),
    subjects,
    students,
    warnings,
  };
}
