import PDFDocument from 'pdfkit';

export const generateResultPDF = (result, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Stream the PDF directly to the Express response stream
  doc.pipe(res);

  // Header & Title
  doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text('Nour Academy', { align: 'center' });
  doc.moveDown(0.3);
  doc.fillColor('#2563eb').fontSize(14).font('Helvetica-Bold').text('Official Exam Result Report', { align: 'center' });
  doc.moveDown(1.5);

  // Divider line
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cbd5e1').lineWidth(1).stroke();
  doc.moveDown(1.5);

  // Student Info Section
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(`Student Name: `, { continued: true });
  doc.font('Helvetica').text(result.studentName);
  doc.moveDown(0.5);

  const dateStr = result.createdAt ? new Date(result.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  doc.font('Helvetica-Bold').text(`Exam Date: `, { continued: true });
  doc.font('Helvetica').text(dateStr);
  doc.moveDown(0.5);

  const statusText = result.status === 'passed' ? 'PASSED 🎉' : 'FAILED';
  const statusColor = result.status === 'passed' ? '#16a34a' : '#dc2626';
  doc.font('Helvetica-Bold').text(`Status: `, { continued: true });
  doc.fillColor(statusColor).font('Helvetica-Bold').text(statusText);
  doc.moveDown(1.5);

  // Results Details Box
  const startY = doc.y;
  doc.rect(50, startY, 495, 130).fillAndStroke('#f8fafc', '#e2e8f0');
  
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold');
  doc.text(`Total Score: ${result.score} / 100`, 70, startY + 20);
  doc.text(`Percentage: ${result.percentage}%`, 70, startY + 45);
  doc.text(`Correct Questions: ${result.correctAnswers} / ${result.totalQuestions}`, 70, startY + 70);
  doc.text(`Wrong Questions: ${Math.max(0, result.totalQuestions - result.correctAnswers)} / ${result.totalQuestions}`, 70, startY + 95);

  doc.moveDown(4);

  // Footer Message
  doc.fillColor('#64748b').fontSize(10).font('Helvetica-Oblique').text('Thank you for completing your exam with Nour Academy. Wish you all the best!', 50, 700, { align: 'center', width: 495 });

  // Finalize PDF
  doc.end();
};