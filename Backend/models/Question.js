import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  optionA: { type: String, required: true },
  optionB: { type: String, required: true },
  optionC: { type: String, required: true },
  optionD: { type: String, required: true },
  correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  points: { type: Number, default: 2 },
  order: { type: Number, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  part: { type: String }
}, { timestamps: true });

export default mongoose.model('Question', questionSchema);