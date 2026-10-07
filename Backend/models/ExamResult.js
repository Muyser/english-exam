import mongoose from 'mongoose';

const examResultSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  percentage: { type: Number, required: true },
  status: { type: String, enum: ['passed', 'failed'], required: true },
  timeSpent: { type: Number }, // in seconds
  answersSummary: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedAnswer: { type: String },
    isCorrect: { type: Boolean }
  }]
}, { timestamps: true });

export default mongoose.model('ExamResult', examResultSchema);