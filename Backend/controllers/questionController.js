import Question from '../models/Question.js';
import ExamResult from '../models/ExamResult.js';
import ExamSetting from '../models/ExamSetting.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const [questions, results, setting] = await Promise.all([
      Question.find(),
      ExamResult.find(),
      ExamSetting.findOne(),
    ]);

    const totalQuestions = questions.length;
    const activeQuestions = questions.filter((q) => q.status === 'active').length;
    const required = setting?.numberOfQuestions || 50;
    const totalResults = results.length;

    const scores = results.map((r) => r.percentage || 0);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const high = scores.length ? Math.max(...scores) : 0;
    const low = scores.length ? Math.min(...scores) : 0;

    // Filter results created today
    const today = new Date().toDateString();
    const todayCount = results.filter((r) => new Date(r.createdAt || r.created_date).toDateString() === today).length;

    res.json({
      totalQuestions,
      activeQuestions,
      required,
      totalResults,
      avg,
      high,
      low,
      todayCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all questions
export const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find().sort({ order: 1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new question
export const createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a question
export const updateQuestion = async (req, res) => {
  try {
    const updated = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Bulk update / reorder questions
export const bulkUpdateQuestions = async (req, res) => {
  try {
    const updates = req.body; // Expects an array of objects with id and fields to update
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: 'Payload must be an array of updates' });
    }

    const operations = updates.map((u) => ({
      updateOne: {
        filter: { _id: u.id },
        update: { $set: u },
      },
    }));

    await Question.bulkWrite(operations);
    res.json({ message: 'Bulk update successful' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a question
export const deleteQuestion = async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};