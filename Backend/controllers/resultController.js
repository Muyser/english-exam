import ExamResult from '../models/ExamResult.js';
import reshaper from 'arabic-persian-reshaper';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bidiFactory from 'bidi-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize bidi-js instance
let bidi = null;
try {
  bidi = bidiFactory();
} catch (e) {
  console.warn('bidi-js initialization skipped, falling back to standard text.');
}

// Reshapes Arabic cursive letters and reorders character sequence for PDFKit
function formatRTL(text) {
  if (!text) return '—';
  const str = String(text);
  const containsArabic = /[\u0600-\u06FF]/.test(str);
  if (!containsArabic) return str;

  try {
    // 1. Reshape letters so they connect properly
    const reshaped = reshaper.ArabicShaper.convertArabic(str);
    
    // 2. Reverse word order so PDFKit's LTR layout displays them naturally from right to left
    return reshaped.split(' ').reverse().join(' ');
  } catch (err) {
    return str;
  }
}

// Helper to build date/time range query filters
const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  return filter;
};

// Helper to configure fonts safely
function applyFont(doc) {
  const fontPath = path.join(__dirname, '../fonts/Amiri-Regular.ttf');
  if (fs.existsSync(fontPath)) {
    doc.registerFont('AmiriFont', fontPath);
    doc.font('AmiriFont');
  } else {
    doc.font('Helvetica');
  }
}

// 1. Export All Results PDF (with date & time filter)
export const getAllResultsPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);

    const results = await ExamResult.find(dateFilter).sort({ createdAt: -1 });

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const fontPath = path.join(__dirname, '../fonts/Amiri-Regular.ttf');
    const hasFont = fs.existsSync(fontPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="All_Exam_Results_${new Date().toISOString().split('T')[0]}.pdf"`
    );

    doc.pipe(res);

    if (hasFont) {
      try { doc.font(fontPath); } catch (e) { doc.font('Helvetica-Bold'); }
    } else {
      doc.font('Helvetica-Bold');
    }

    doc.fillColor('#0f172a').fontSize(20).text('Nour Academy', { align: 'center' });
    doc.moveDown(0.2);
    doc.fillColor('#2563eb').fontSize(13).text('All Students Exam Results Summary', { align: 'center' });
    doc.moveDown(0.5);

    if (!hasFont) doc.font('Helvetica');
    doc.fillColor('#64748b').fontSize(9).text(`Total Students: ${results.length} | Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);

    const startX = 40;
    let y = doc.y;

    const drawHeader = (currentY) => {
      doc.rect(startX, currentY, 515, 22).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(9);
      doc.text('#', startX + 8, currentY + 6, { width: 25, align: 'center' });
      doc.text('Student Name', startX + 35, currentY + 6, { width: 145 });
      doc.text('Score', startX + 180, currentY + 6, { width: 55, align: 'center' });
      doc.text('Percentage', startX + 240, currentY + 6, { width: 65, align: 'center' });
      doc.text('Correct', startX + 310, currentY + 6, { width: 50, align: 'center' });
      doc.text('Wrong', startX + 365, currentY + 6, { width: 50, align: 'center' });
      doc.text('Date', startX + 425, currentY + 6, { width: 80, align: 'center' });
    };

    drawHeader(y);
    y += 22;

    results.forEach((r, index) => {
      if (y > 750) {
        doc.addPage();
        if (hasFont) {
          try { doc.font(fontPath); } catch (e) { doc.font('Helvetica'); }
        }
        y = 40;
        drawHeader(y);
        y += 22;
      }

      const score = r.score !== undefined ? r.score : (r.correctAnswers || 0) * 2;
      const totalQ = r.totalQuestions || 50;
      const wrong = r.wrongAnswers !== undefined ? r.wrongAnswers : Math.max(0, totalQ - (r.correctAnswers || 0));
      const pct = r.percentage || Math.round((score / 100) * 100);
      const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A';

      const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(startX, y, 515, 20).fillAndStroke(bgColor, '#f1f5f9');

      const displayName = formatRTL(r.studentName);

      doc.fillColor('#64748b').fontSize(9);
      doc.text(`${index + 1}`, startX + 8, y + 5, { width: 25, align: 'center' });

      doc.fillColor('#0f172a');
      doc.text(displayName, startX + 35, y + 5, { width: 145, ellipsis: true });

      doc.text(`${score} / 100`, startX + 180, y + 5, { width: 55, align: 'center' });

      const pctColor = pct >= 75 ? '#15803d' : pct >= 50 ? '#b45309' : '#dc2626';
      doc.fillColor(pctColor);
      doc.text(`${pct}%`, startX + 240, y + 5, { width: 65, align: 'center' });

      doc.fillColor('#16a34a');
      doc.text(`${r.correctAnswers || 0}/${totalQ}`, startX + 310, y + 5, { width: 50, align: 'center' });

      doc.fillColor('#dc2626');
      doc.text(`${wrong}/${totalQ}`, startX + 365, y + 5, { width: 50, align: 'center' });

      doc.fillColor('#475569');
      doc.text(dateStr, startX + 425, y + 5, { width: 80, align: 'center' });

      y += 20;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};

// 2. Download Single Student PDF
export const getResultPDF = async (req, res) => {
  try {
    const result = await ExamResult.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Exam result not found' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(result.studentName)}_Result.pdf"`
    );

    doc.pipe(res);
    applyFont(doc);

    doc.fontSize(22).text('Nour Academy', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).text('Official Exam Result Report', { align: 'center' });
    doc.moveDown(1);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(1.5);

    const studentNameFormatted = formatRTL(result.studentName);
    doc.fontSize(12).text(`Student Name / اسم الطالب: ${studentNameFormatted}`);
    doc.moveDown(0.5);

    const dateStr = result.createdAt ? new Date(result.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    doc.text(`Exam Date / تاريخ الامتحان: ${dateStr}`);
    doc.moveDown(0.5);

    const statusText = result.status === 'passed' ? 'PASSED / ناجح 🎉' : 'FAILED / راسب';
    doc.text(`Status / الحالة: ${statusText}`);
    doc.moveDown(1.5);

    const startY = doc.y;
    doc.rect(50, startY, 495, 120).fillAndStroke('#f8fafc', '#cbd5e1');

    doc.fillColor('#0f172a').fontSize(12);
    doc.text(`Total Score / الدرجة الكلية: ${result.score} / 100`, 70, startY + 18);
    doc.text(`Percentage / النسبة المئوية: ${result.percentage}%`, 70, startY + 42);
    doc.text(`Correct Questions / الأسئلة الصحيحة: ${result.correctAnswers} / ${result.totalQuestions}`, 70, startY + 66);
    doc.text(`Wrong Questions / الأسئلة الخاطئة: ${Math.max(0, result.totalQuestions - result.correctAnswers)} / ${result.totalQuestions}`, 70, startY + 90);

    doc.moveDown(4);
    doc.fillColor('#64748b').fontSize(10).text('Thank you for completing your exam with Nour Academy.', 50, 700, { align: 'center', width: 495 });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Export Passed Students Only (with date & time filter)
export const getPassedResultsPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);

    const results = await ExamResult.find({
      ...dateFilter,
      $or: [{ percentage: {$gte: 50 } }, { status: 'passed' }],
    }).sort({ createdAt: -1 });

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const fontPath = path.join(__dirname, '../fonts/Amiri-Regular.ttf');
    const hasFont = fs.existsSync(fontPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Passed_Students_Results_${new Date().toISOString().split('T')[0]}.pdf"`
    );

    doc.pipe(res);

    if (hasFont) {
      try { doc.font(fontPath); } catch (e) { doc.font('Helvetica-Bold'); }
    } else {
      doc.font('Helvetica-Bold');
    }

    doc.fillColor('#0f172a').fontSize(20).text('Nour Academy', { align: 'center' });
    doc.moveDown(0.2);
    doc.fillColor('#16a34a').fontSize(13).text('Passed Students Exam Results Summary', { align: 'center' });
    doc.moveDown(0.5);

    if (!hasFont) doc.font('Helvetica');
    doc.fillColor('#64748b').fontSize(9).text(`Total Passed Students: ${results.length} | Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);

    const startX = 40;
    let y = doc.y;

    const drawHeader = (currentY) => {
      doc.rect(startX, currentY, 515, 22).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(9);
      doc.text('#', startX + 8, currentY + 6, { width: 25, align: 'center' });
      doc.text('Student Name', startX + 35, currentY + 6, { width: 145 });
      doc.text('Score', startX + 180, currentY + 6, { width: 55, align: 'center' });
      doc.text('Percentage', startX + 240, currentY + 6, { width: 65, align: 'center' });
      doc.text('Correct', startX + 310, currentY + 6, { width: 50, align: 'center' });
      doc.text('Wrong', startX + 365, currentY + 6, { width: 50, align: 'center' });
      doc.text('Date', startX + 425, currentY + 6, { width: 80, align: 'center' });
    };

    drawHeader(y);
    y += 22;

    results.forEach((r, index) => {
      if (y > 750) {
        doc.addPage();
        if (hasFont) {
          try { doc.font(fontPath); } catch (e) { doc.font('Helvetica'); }
        }
        y = 40;
        drawHeader(y);
        y += 22;
      }

      const score = r.score !== undefined ? r.score : (r.correctAnswers || 0) * 2;
      const totalQ = r.totalQuestions || 50;
      const wrong = r.wrongAnswers !== undefined ? r.wrongAnswers : Math.max(0, totalQ - (r.correctAnswers || 0));
      const pct = r.percentage || Math.round((score / 100) * 100);
      const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A';

      const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(startX, y, 515, 20).fillAndStroke(bgColor, '#f1f5f9');

      const displayName = formatRTL(r.studentName);

      doc.fillColor('#64748b').fontSize(9);
      doc.text(`${index + 1}`, startX + 8, y + 5, { width: 25, align: 'center' });

      doc.fillColor('#0f172a');
      doc.text(displayName, startX + 35, y + 5, { width: 145, ellipsis: true });

      doc.text(`${score} / 100`, startX + 180, y + 5, { width: 55, align: 'center' });

      doc.fillColor('#15803d');
      doc.text(`${pct}%`, startX + 240, y + 5, { width: 65, align: 'center' });

      doc.fillColor('#16a34a');
      doc.text(`${r.correctAnswers || 0}/${totalQ}`, startX + 310, y + 5, { width: 50, align: 'center' });

      doc.fillColor('#dc2626');
      doc.text(`${wrong}/${totalQ}`, startX + 365, y + 5, { width: 50, align: 'center' });

      doc.fillColor('#475569');
      doc.text(dateStr, startX + 425, y + 5, { width: 80, align: 'center' });

      y += 20;
    });

    doc.end();
  } catch (error) {
    console.error('Error in getPassedResultsPDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};

// 4. Export Failed Students Only (with date & time filter)
export const getFailedResultsPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);

    const results = await ExamResult.find({
      ...dateFilter,
      $and: [
        { percentage: { $lt: 50 } },         { status: {$ne: 'passed' } }
      ]
    }).sort({ createdAt: -1 });

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const fontPath = path.join(__dirname, '../fonts/Amiri-Regular.ttf');
    const hasFont = fs.existsSync(fontPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Failed_Students_Results_${new Date().toISOString().split('T')[0]}.pdf"`
    );

    doc.pipe(res);

    if (hasFont) {
      try { doc.font(fontPath); } catch (e) { doc.font('Helvetica-Bold'); }
    } else {
      doc.font('Helvetica-Bold');
    }

    doc.fillColor('#0f172a').fontSize(20).text('Nour Academy', { align: 'center' });
    doc.moveDown(0.2);
    doc.fillColor('#dc2626').fontSize(13).text('Failed Students Exam Results Summary', { align: 'center' });
    doc.moveDown(0.5);

    if (!hasFont) doc.font('Helvetica');
    doc.fillColor('#64748b').fontSize(9).text(`Total Failed Students: ${results.length} | Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);

    const startX = 40;
    let y = doc.y;

    const drawHeader = (currentY) => {
      doc.rect(startX, currentY, 515, 22).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(9);
      doc.text('#', startX + 8, currentY + 6, { width: 25, align: 'center' });
      doc.text('Student Name', startX + 35, currentY + 6, { width: 145 });
      doc.text('Score', startX + 180, currentY + 6, { width: 55, align: 'center' });
      doc.text('Percentage', startX + 240, currentY + 6, { width: 65, align: 'center' });
      doc.text('Correct', startX + 310, currentY + 6, { width: 50, align: 'center' });
      doc.text('Wrong', startX + 365, currentY + 6, { width: 50, align: 'center' });
      doc.text('Date', startX + 425, currentY + 6, { width: 80, align: 'center' });
    };

    drawHeader(y);
    y += 22;

    results.forEach((r, index) => {
      if (y > 750) {
        doc.addPage();
        if (hasFont) {
          try { doc.font(fontPath); } catch (e) { doc.font('Helvetica'); }
        }
        y = 40;
        drawHeader(y);
        y += 22;
      }

      const score = r.score !== undefined ? r.score : (r.correctAnswers || 0) * 2;
      const totalQ = r.totalQuestions || 50;
      const wrong = r.wrongAnswers !== undefined ? r.wrongAnswers : Math.max(0, totalQ - (r.correctAnswers || 0));
      const pct = r.percentage || Math.round((score / 100) * 100);
      const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A';

      const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(startX, y, 515, 20).fillAndStroke(bgColor, '#f1f5f9');

      const displayName = formatRTL(r.studentName);

      doc.fillColor('#64748b').fontSize(9);
      doc.text(`${index + 1}`, startX + 8, y + 5, { width: 25, align: 'center' });

      doc.fillColor('#0f172a');
      doc.text(displayName, startX + 35, y + 5, { width: 145, ellipsis: true });

      doc.text(`${score} / 100`, startX + 180, y + 5, { width: 55, align: 'center' });

      doc.fillColor('#dc2626');
      doc.text(`${pct}%`, startX + 240, y + 5, { width: 65, align: 'center' });

      doc.fillColor('#16a34a');
      doc.text(`${r.correctAnswers || 0}/${totalQ}`, startX + 310, y + 5, { width: 50, align: 'center' });

      doc.fillColor('#dc2626');
      doc.text(`${wrong}/${totalQ}`, startX + 365, y + 5, { width: 50, align: 'center' });

      doc.fillColor('#475569');
      doc.text(dateStr, startX + 425, y + 5, { width: 80, align: 'center' });

      y += 20;
    });

    doc.end();
  } catch (error) {
    console.error('Error in getFailedResultsPDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};

// 5. Save Student Result
export const createResult = async (req, res) => {
  try {
    const { studentName, score, totalQuestions, correctAnswers, percentage, status, timeSpent, answersSummary } = req.body;

    const newResult = new ExamResult({
      studentName,
      score,
      totalQuestions,
      correctAnswers,
      percentage,
      status,
      timeSpent,
      answersSummary,
    });

    const savedResult = await newResult.save();

    res.status(201).json({
      message: 'Exam submitted successfully',
      resultId: savedResult._id,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 6. Get All Results JSON (with date & time range filter)
export const getResults = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);

    const results = await ExamResult.find(dateFilter).sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Get Result By ID
export const getResultById = async (req, res) => {
  try {
    const result = await ExamResult.findById(req.params.id).populate('answersSummary.questionId');
    if (!result) return res.status(404).json({ message: 'Exam result not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. Update Exam Result
export const updateResult = async (req, res) => {
  try {
    const { studentName, score, correctAnswers, wrongAnswers, totalQuestions, percentage } = req.body;

    const result = await ExamResult.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Exam result not found' });

    result.studentName = studentName !== undefined ? studentName : result.studentName;
    result.score = score !== undefined ? score : result.score;
    result.correctAnswers = correctAnswers !== undefined ? correctAnswers : result.correctAnswers;
    result.wrongAnswers = wrongAnswers !== undefined ? wrongAnswers : result.wrongAnswers;
    result.totalQuestions = totalQuestions !== undefined ? totalQuestions : result.totalQuestions;
    result.percentage = percentage !== undefined ? percentage : result.percentage;

    const updatedResult = await result.save();
    res.json(updatedResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 9. Delete Single Result
export const deleteResult = async (req, res) => {
  try {
    const deleted = await ExamResult.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Exam result not found' });
    res.json({ message: 'Exam result deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 10. Delete All Results
export const deleteAllResults = async (req, res) => {
  try {
    await ExamResult.deleteMany({});
    res.json({ message: 'All exam results cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};