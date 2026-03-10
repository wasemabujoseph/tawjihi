const ADMIN_PASSWORD = 'admin'; // يمكنك تغييرها
const EXAMS_FOLDER_NAME = 'TawjihiExams_2026';
const SHEET_NAME = 'Results';

function doGet(e) { return handleRequest(e.parameter); }
function doPost(e) { return handleRequest(JSON.parse(e.postData.contents)); }

function handleRequest(params) {
  const action = params.action;
  try {
    switch (action) {
      case 'listExams': return jsonResponse(listExams());
      case 'getExam': return jsonResponse(getExam(params.examId));
      case 'submitResult': return jsonResponse(submitResult(params));
      case 'getUserResults': return jsonResponse(getUserResults(params.userId));
      case 'listAllResults': return jsonResponse(listAllResults(params.adminPassword));
      case 'uploadExam': return jsonResponse(uploadExam(params.adminPassword, params.exam));
      default: return jsonResponse({ ok: false, error: 'Action not found' });
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['userId', 'userName', 'examId', 'subject', 'score', 'wrongItemsJson', 'createdAt']);
  }
  return sheet;
}

function getOrCreateFolder() {
  const folders = DriveApp.getFoldersByName(EXAMS_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(EXAMS_FOLDER_NAME);
}

function listExams() {
  const folder = getOrCreateFolder();
  const files = folder.getFiles();
  const exams = [];
  while (files.hasNext()) {
    const file = files.next();
    try {
      const data = JSON.parse(file.getBlob().getDataAsString());
      exams.push({ id: file.getId(), subject: data.subject, duration: data.duration, qCount: (data.questions || []).length });
    } catch(e) {}
  }
  return { ok: true, exams };
}

function getExam(id) {
  const data = JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString());
  return { ok: true, exam: data };
}

function submitResult(p) {
  const sheet = getOrCreateSheet();
  sheet.appendRow([p.userId, p.userName, p.examId, p.subject, p.score, p.wrongItemsJson, new Date()]);
  return { ok: true };
}

function getUserResults(userId) {
  const rows = getOrCreateSheet().getDataRange().getValues().slice(1);
  const results = rows.filter(r => r[0] == userId).map(r => ({ subject: r[3], score: r[4], createdAt: r[6], wrongItemsJson: r[5] }));
  return { ok: true, results };
}

function listAllResults(pass) {
  if (pass !== ADMIN_PASSWORD) return { ok: false, error: 'Unauthorized' };
  const rows = getOrCreateSheet().getDataRange().getValues().slice(1);
  return { ok: true, results: rows.map(r => ({ userName: r[1], subject: r[3], score: r[4], createdAt: r[6] })) };
}

function uploadExam(pass, exam) {
  if (pass !== ADMIN_PASSWORD) return { ok: false, error: 'Unauthorized' };
  const folder = getOrCreateFolder();
  const name = exam.subject + ".json";
  const existing = folder.getFilesByName(name);
  if (existing.hasNext()) existing.next().setContent(JSON.stringify(exam));
  else folder.createFile(name, JSON.stringify(exam));
  return { ok: true };
}
