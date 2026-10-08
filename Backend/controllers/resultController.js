import ExamResult from '../models/ExamResult.js';
import PDFDocument from 'pdfkit';
import bidiFactory from 'bidi-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper function to build and stream PDF report
const generateResultPDF = (result, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${result.studentName}_Exam_Result.pdf"`);

  doc.pipe(res);

  // Header Branding
  doc.fillColor('#0f172a').fontSize(22).font('Helvetica-Bold').text('Nour Academy', { align: 'center' });
  doc.moveDown(0.3);
  doc.fillColor('#2563eb').fontSize(14).font('Helvetica-Bold').text('Official Exam Result Report', { align: 'center' });
  doc.moveDown(1);

  // Divider Line
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.moveDown(1.5);

  // Student Info Details
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Student Name: ', { continued: true });
  doc.font('Helvetica').text(result.studentName);
  doc.moveDown(0.5);

  const dateStr = result.createdAt ? new Date(result.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  doc.font('Helvetica-Bold').text('Exam Date: ', { continued: true });
  doc.font('Helvetica').text(dateStr);
  doc.moveDown(0.5);

  const statusText = result.status === 'passed' ? 'PASSED 🎉' : 'FAILED';
  const statusColor = result.status === 'passed' ? '#16a34a' : '#dc2626';
  doc.font('Helvetica-Bold').text('Status: ', { continued: true });
  doc.fillColor(statusColor).font('Helvetica-Bold').text(statusText);
  doc.moveDown(1.5);

  // Score Summary Card Box
  const startY = doc.y;
  doc.rect(50, startY, 495, 120).fillAndStroke('#f8fafc', '#cbd5e1');

  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold');
  doc.text(`Total Score: ${result.score} / 100`, 70, startY + 18);
  doc.text(`Percentage: ${result.percentage}%`, 70, startY + 42);
  doc.text(`Correct Questions: ${result.correctAnswers} / ${result.totalQuestions}`, 70, startY + 66);
  doc.text(`Wrong Questions: ${Math.max(0, result.totalQuestions - result.correctAnswers)} / ${result.totalQuestions}`, 70, startY + 90);

  doc.moveDown(4);

  // Footer Message
  doc.fillColor('#64748b').fontSize(10).font('Helvetica-Oblique').text('Thank you for completing your exam with Nour Academy. Wish you all the best!', 50, 700, { align: 'center', width: 495 });

  doc.end();
};

// Create a new exam result (For Students)
export const createResult = async (req, res) => {
  try {
    const {
      studentName,
      score,
      totalQuestions,
      correctAnswers,
      percentage,
      status,
      timeSpent,
      answersSummary,
    } = req.body;

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

// Protected: Stream PDF report for an exam result
export const getResultPDF = async (req, res) => {
  try {
    const result = await ExamResult.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Exam result not found' });
    }

    generateResultPDF(result, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all student exam results
export const getResults = async (req, res) => {
  try {
    const results = await ExamResult.find().sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single exam result by ID
export const getResultById = async (req, res) => {
  try {
    const result = await ExamResult.findById(req.params.id).populate('answersSummary.questionId');
    if (!result) {
      return res.status(404).json({ message: 'Exam result not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a single exam result
export const deleteResult = async (req, res) => {
  try {
    const deleted = await ExamResult.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Exam result not found' });
    }
    res.json({ message: 'Exam result deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all exam results
export const deleteAllResults = async (req, res) => {
  try {
    await ExamResult.deleteMany({});
    res.json({ message: 'All exam results cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bidi = bidiFactory();

// Helper function to handle Arabic / RTL text shaping for PDFKit
function fixRTLText(text) {
  if (!text) return '';
  // Check if string contains Arabic characters
  const containsArabic = /[\u0600-\u06FF]/.test(text);
  if (!containsArabic) return text;

  // Process RTL text layout
  const bidiText = bidi.getReorderedString(text, 'rtl');
  return bidiText;
}

export const getAllResultsPDF = async (req, res) => {
  try {
    const results = await ExamResult.find().sort({ createdAt: -1 });

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    // Path to your downloaded TTF font
    const fontPath = path.join(__dirname, '../fonts/Amiri-Regular.ttf');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="All_Exam_Results_${new Date().toISOString().split('T')[0]}.pdf"`);

    doc.pipe(res);

    // Register Unicode/Arabic Font
    doc.registerFont('ArabicFont', fontPath);
    doc.font('ArabicFont');

    // Header Title
    doc.fillColor('#0f172a').fontSize(20).text('Nour Academy', { align: 'center' });
    doc.moveDown(0.2);
    doc.fillColor('#2563eb').fontSize(13).text('All Students Exam Results Summary', { align: 'center' });
    doc.moveDown(0.5);

    doc.fillColor('#64748b').fontSize(9).text(`Total Students: ${results.length}  |  Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);

    const startX = 40;
    let y = doc.y;

    const drawHeader = (currentY) => {
      doc.rect(startX, currentY, 515, 22).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(9);
      doc.text('Student Name', startX + 10, currentY + 6, { width: 150 });
      doc.text('Score', startX + 170, currentY + 6, { width: 60, align: 'center' });
      doc.text('Percentage', startX + 240, currentY + 6, { width: 65, align: 'center' });
      doc.text('Correct', startX + 315, currentY + 6, { width: 50, align: 'center' });
      doc.text('Wrong', startX + 370, currentY + 6, { width: 50, align: 'center' });
      doc.text('Date', startX + 430, currentY + 6, { width: 75, align: 'center' });
    };

    drawHeader(y);
    y += 22;

    results.forEach((r, index) => {
      if (y > 750) {
        doc.addPage();
        doc.font('ArabicFont');
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

      // Process and fix Arabic name formatting
      const formattedName = fixRTLText(r.studentName || '—');

      doc.fillColor('#0f172a').fontSize(9);
      doc.text(formattedName, startX + 10, y + 5, { width: 150, ellipsis: true });
      doc.text(`${score} / 100`, startX + 170, y + 5, { width: 60, align: 'center' });

      const pctColor = pct >= 75 ? '#15803d' : pct >= 50 ? '#b45309' : '#dc2626';
      doc.fillColor(pctColor);
      doc.text(`${pct}%`, startX + 240, y + 5, { width: 65, align: 'center' });

      doc.fillColor('#16a34a');
      doc.text(`${r.correctAnswers || 0}/${totalQ}`, startX + 315, y + 5, { width: 50, align: 'center' });

      doc.fillColor('#dc2626');
      doc.text(`${wrong}/${totalQ}`, startX + 370, y + 5, { width: 50, align: 'center' });

      doc.fillColor('#475569');
      doc.text(dateStr, startX + 430, y + 5, { width: 75, align: 'center' });

      y += 20;
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};