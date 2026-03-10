const ADMIN_PASSWORD = 'admin';
const EXAMS_FOLDER_NAME = 'TawjihiExamsJSON';
const SHEET_RESULTS = 'Results';

function doGet() {
  return jsonOutput({ ok: true, message: 'API running' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;

    switch (action) {
      case 'listExams':
        return jsonOutput(listExams());

      case 'getExam':
        return jsonOutput(getExam(body.examId));

      case 'submitResult':
        return jsonOutput(submitResult(body));

      case 'getUserResults':
        return jsonOutput(getUserResults(body.userId));

      case 'listAllResults':
        return jsonOutput(listAllResults(body.adminPassword));

      case 'uploadExam':
        return jsonOutput(uploadExam(body.adminPassword, body.exam));

      default:
        return jsonOutput({ ok: false, error: 'Unknown action' });
    }
  } catch (err) {
    return jsonOutput({ ok: false, error: err.message });
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(name) {
  const ss = getSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function setupResultsSheet() {
  const sh = getOrCreateSheet(SHEET_RESULTS);
  if (sh.getLastRow() === 0) {
    sh.appendRow([
      'id',
      'userId',
      'userName',
      'examId',
      'subject',
      'score',
      'answersJson',
      'openAnswersJson',
      'wrongItemsJson',
      'createdAt'
    ]);
  }
  return sh;
}

function getOrCreateExamsFolder() {
  const folders = DriveApp.getFoldersByName(EXAMS_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(EXAMS_FOLDER_NAME);
}

function listExams() {
  const folder = getOrCreateExamsFolder();
  const files = folder.getFiles();
  const exams = [];

  while (files.hasNext()) {
    const file = files.next();
    try {
      const content = file.getBlob().getDataAsString('UTF-8');
      const exam = JSON.parse(content);

      exams.push({
        id: file.getId(),
        fileName: file.getName(),
        subject: exam.subject || file.getName(),
        duration: exam.duration || 3600,
        questions: exam.questions || [],
        openQuestions: exam.openQuestions || []
      });
    } catch (e) {}
  }

  exams.sort((a, b) => String(a.subject).localeCompare(String(b.subject), 'ar'));
  return { ok: true, exams };
}

function getExam(examId) {
  if (!examId) throw new Error('examId is required');

  const file = DriveApp.getFileById(examId);
  const content = file.getBlob().getDataAsString('UTF-8');
  const exam = JSON.parse(content);

  exam.id = examId;
  return { ok: true, exam };
}

function validateAdmin(adminPassword) {
  if (adminPassword !== ADMIN_PASSWORD) {
    throw new Error('Unauthorized');
  }
}

function uploadExam(adminPassword, exam) {
  validateAdmin(adminPassword);

  if (!exam || !exam.subject) {
    throw new Error('Invalid exam JSON');
  }

  if (!Array.isArray(exam.questions)) exam.questions = [];
  if (!Array.isArray(exam.openQuestions)) exam.openQuestions = [];
  if (!exam.duration) exam.duration = 3600;

  const folder = getOrCreateExamsFolder();
  const fileName = sanitizeFileName(exam.subject) + '.json';
  const content = JSON.stringify(exam, null, 2);

  const existing = folder.getFilesByName(fileName);
  if (existing.hasNext()) {
    const file = existing.next();
    file.setContent(content);
    return { ok: true, message: 'Exam updated', fileId: file.getId() };
  } else {
    const file = folder.createFile(fileName, content, MimeType.PLAIN_TEXT);
    return { ok: true, message: 'Exam uploaded', fileId: file.getId() };
  }
}

function submitResult(body) {
  const sh = setupResultsSheet();

  const id = Utilities.getUuid();
  const row = [
    id,
    body.userId || '',
    body.userName || '',
    body.examId || '',
    body.subject || '',
    Number(body.score || 0),
    JSON.stringify(body.answers || {}),
    JSON.stringify(body.openAnswers || {}),
    JSON.stringify(body.wrongItems || []),
    new Date().toISOString()
  ];

  sh.appendRow(row);
  return { ok: true, resultId: id };
}

function getUserResults(userId) {
  const sh = setupResultsSheet();
  const values = sh.getDataRange().getValues();

  if (values.length < 2) return { ok: true, results: [] };

  const headers = values[0];
  const rows = values.slice(1);

  const results = rows
    .filter(r => String(r[1]) === String(userId))
    .map(r => rowToObject(headers, r))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return { ok: true, results };
}

function listAllResults(adminPassword) {
  validateAdmin(adminPassword);

  const sh = setupResultsSheet();
  const values = sh.getDataRange().getValues();

  if (values.length < 2) return { ok: true, results: [] };

  const headers = values[0];
  const rows = values.slice(1);

  const results = rows
    .map(r => rowToObject(headers, r))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return { ok: true, results };
}

function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = row[i];
  });
  return obj;
}

function sanitizeFileName(name) {
  return String(name)
    .replace(/[\\/:*?"<>|]/g, '-')
    .trim();
}
