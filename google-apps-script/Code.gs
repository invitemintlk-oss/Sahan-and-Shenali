/**
 * Wedding RSVP + Wishes → Google Sheets
 *
 * Paste this whole file into Extensions → Apps Script → Code.gs of the spreadsheet,
 * run `setup` once (to authorize + create the sheets), then Deploy → New deployment → Web app
 * (Execute as: Me, Who has access: Anyone) and put the /exec URL in VITE_SHEETS_ENDPOINT.
 *
 * Sheets "RSVP" and "Wishes" are created automatically with styled headers the first time
 * they are needed — you never have to create them by hand.
 */

var SPREADSHEET_ID = '19vBufqGiKGF_m6HpOXyWaK2dWhsP3ad9am_dSz7-o7g';

var SHEETS = {
  rsvp: {
    name: 'RSVP',
    headers: ['Submitted At', 'Name', 'Attendance', 'Invited As', 'Page URL', 'User Agent'],
    widths: [160, 220, 130, 200, 260, 260],
  },
  wish: {
    name: 'Wishes',
    headers: ['Submitted At', 'Name', 'Message', 'Invited As', 'Show on Website', 'Page URL', 'User Agent'],
    widths: [160, 180, 420, 180, 130, 260, 260],
  },
};

var HEADER_BG = '#8E2457'; // deep berry
var HEADER_FG = '#FFFFFF';
var MAX_PUBLIC_WISHES = 100;

/* ------------------------------------------------------------------ */
/* Entry points                                                        */
/* ------------------------------------------------------------------ */

/** Run once from the editor: authorizes the script and creates both sheets with headers. */
function setup() {
  var ss = getSpreadsheet_();
  Object.keys(SHEETS).forEach(function (key) {
    getSheet_(ss, key);
  });
  Logger.log('Sheets ready: ' + Object.keys(SHEETS).map(function (k) { return SHEETS[k].name; }).join(', '));
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var data = parsePayload_(e);
    var type = String(data.type || 'rsvp').toLowerCase();
    var ss = getSpreadsheet_();

    if (type === 'wish' || type === 'wishes') {
      saveWish_(ss, data);
    } else if (type === 'rsvp') {
      saveRsvp_(ss, data);
    } else {
      throw new Error('Unknown type: ' + type);
    }

    return json_({ ok: true, type: type });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

/** GET ?action=wishes → visible wishes, newest first. */
function doGet(e) {
  try {
    var action = e && e.parameter && e.parameter.action;
    if (action === 'wishes') {
      return json_({ ok: true, wishes: readPublicWishes_(getSpreadsheet_()) });
    }
    return json_({ ok: true, message: 'Wedding RSVP & Wishes endpoint is running.' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/* ------------------------------------------------------------------ */
/* Writers                                                             */
/* ------------------------------------------------------------------ */

function saveRsvp_(ss, data) {
  var name = clean_(data.name, 100);
  var attendance = String(data.attendance || '').toLowerCase();
  if (!name) throw new Error('Name is required');
  if (attendance !== 'yes' && attendance !== 'no') throw new Error('Attendance is required');

  var sheet = getSheet_(ss, 'rsvp');
  sheet.appendRow([
    new Date(),
    safe_(name),
    attendance === 'yes' ? 'Attending' : 'Not Attending',
    safe_(clean_(data.invitedAs, 120)),
    safe_(clean_(data.pageUrl, 500)),
    safe_(clean_(data.userAgent, 500)),
  ]);
  formatLastRow_(sheet);

  // Colour the attendance cell so it's easy to scan.
  var cell = sheet.getRange(sheet.getLastRow(), 3);
  if (attendance === 'yes') cell.setBackground('#F7DCE7').setFontColor('#8E2457').setFontWeight('bold');
  else cell.setBackground('#ECE3EA').setFontColor('#4E1F45');
}

function saveWish_(ss, data) {
  var name = clean_(data.name, 80);
  var message = clean_(data.message, 1000, true);
  if (!name || !message) throw new Error('Name and message are required');

  var sheet = getSheet_(ss, 'wish');
  sheet.appendRow([
    new Date(),
    safe_(name),
    safe_(message),
    safe_(clean_(data.invitedAs, 120)),
    true,
    safe_(clean_(data.pageUrl, 500)),
    safe_(clean_(data.userAgent, 500)),
  ]);
  formatLastRow_(sheet);

  // "Show on Website" as a checkbox — untick it to hide a wish from the site.
  sheet.getRange(sheet.getLastRow(), 5).insertCheckboxes().check();
}

/* ------------------------------------------------------------------ */
/* Readers                                                             */
/* ------------------------------------------------------------------ */

function readPublicWishes_(ss) {
  var sheet = getSheet_(ss, 'wish');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var out = [];
  for (var i = rows.length - 1; i >= 0 && out.length < MAX_PUBLIC_WISHES; i--) {
    var r = rows[i];
    var visible = r[4] === true || String(r[4]).toUpperCase() === 'TRUE';
    if (!visible || !r[1] || !r[2]) continue;
    out.push({
      submittedAt: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name: String(r[1]),
      message: String(r[2]),
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Sheet helpers                                                       */
/* ------------------------------------------------------------------ */

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/** Returns the sheet for `key`, creating it and writing/styling the header row if needed. */
function getSheet_(ss, key) {
  var def = SHEETS[key];
  var sheet = ss.getSheetByName(def.name);
  if (!sheet) sheet = ss.insertSheet(def.name);

  var cols = def.headers.length;
  var headerRange = sheet.getRange(1, 1, 1, cols);
  var current = headerRange.getValues()[0];
  var rowEmpty = current.every(function (v) { return v === '' || v === null; });
  var matches = current.every(function (v, i) { return String(v) === def.headers[i]; });

  if (sheet.getLastRow() === 0 || rowEmpty) {
    headerRange.setValues([def.headers]);
    styleHeader_(sheet, def);
  } else if (!matches && sheet.getLastRow() === 1) {
    // Only a header row exists but it's outdated → safe to replace.
    headerRange.setValues([def.headers]);
    styleHeader_(sheet, def);
  }
  return sheet;
}

function styleHeader_(sheet, def) {
  var cols = def.headers.length;
  sheet
    .getRange(1, 1, 1, cols)
    .setFontWeight('bold')
    .setBackground(HEADER_BG)
    .setFontColor(HEADER_FG)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 34);
  (def.widths || []).forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });

  // Remove the extra blank columns of a brand-new sheet for a tidy look.
  var maxCols = sheet.getMaxColumns();
  if (maxCols > cols && sheet.getLastColumn() <= cols) sheet.deleteColumns(cols + 1, maxCols - cols);
}

function formatLastRow_(sheet) {
  var row = sheet.getLastRow();
  sheet.getRange(row, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange(row, 1, 1, sheet.getLastColumn()).setVerticalAlignment('top').setWrap(true);
}

/* ------------------------------------------------------------------ */
/* Parsing / sanitising                                                */
/* ------------------------------------------------------------------ */

function parsePayload_(e) {
  // FormData field `payload` (no-cors fallback) or the raw text/plain / JSON body.
  var text = (e && e.parameter && e.parameter.payload) || (e && e.postData && e.postData.contents);
  if (!text) throw new Error('No payload received');
  var data = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Invalid payload');
  return data;
}

function clean_(value, maxLen, keepNewlines) {
  if (value === undefined || value === null) return '';
  var s = String(value);
  s = keepNewlines ? s.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ') : s.replace(/\s+/g, ' ');
  s = s.trim();
  return maxLen ? s.slice(0, maxLen) : s;
}

/** Stop guest text from being interpreted as a spreadsheet formula. */
function safe_(s) {
  s = String(s || '');
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
