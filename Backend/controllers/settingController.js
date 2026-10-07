import ExamSetting from '../models/ExamSetting.js';

// Get exam settings
export const getSettings = async (req, res) => {
  try {
    let settings = await ExamSetting.findOne();
    if (!settings) {
      // Create default settings if none exist yet
      settings = await ExamSetting.create({
        examTitle: 'Final Grammar Exam',
        timeLimit: 60,
        passingScore: 50,
        status: 'active',
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update exam settings
export const updateSettings = async (req, res) => {
  try {
    let settings = await ExamSetting.findOne();
    if (!settings) {
      settings = await ExamSetting.create(req.body);
    } else {
      settings = await ExamSetting.findByIdAndUpdate(settings._id, req.body, { new: true });
    }
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};