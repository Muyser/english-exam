import mongoose from 'mongoose';

const examSettingSchema = new mongoose.Schema({
  examTitle: { type: String, required: true },
  examDescription: { type: String },
  timeLimit: { type: Number, required: true }, // in minutes
  passingScore: { type: Number, required: true },
  status: { type: String, enum: ['active', 'inactive', 'closed'], default: 'inactive' }
}, { timestamps: true });

export default mongoose.model('ExamSetting', examSettingSchema);