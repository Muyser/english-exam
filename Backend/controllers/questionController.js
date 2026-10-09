import Question from '../models/Question.js';
import ExamResult from '../models/ExamResult.js';
import ExamSetting from '../models/ExamSetting.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalQuestions = await Question.countDocuments();
    const activeQuestions = await Question.countDocuments({ active: true });

    const results = await ExamResult.find();
    const totalResults = results.length;

    let avg = 0;
    let high = 0;
    let low = 0;
    let passedCount = 0;
    let failedCount = 0;

    if (totalResults > 0) {
      const percentages = results.map(r => {
        if (r.percentage !== undefined) return r.percentage;
        const score = r.score !== undefined ? r.score : (r.correctAnswers || 0) * 2;
        return Math.round((score / 100) * 100);
      });

      const sum = percentages.reduce((acc, curr) => acc + curr, 0);
      avg = Math.round(sum / totalResults);
      high = Math.max(...percentages);
      low = Math.min(...percentages);

      // Count passed vs failed (pass mark >= 50%)
      passedCount = results.filter(r => {
        const pct = r.percentage !== undefined ? r.percentage : (r.score || 0);
        return pct >= 50 || r.status === 'passed';
      }).length;

      failedCount = totalResults - passedCount;
    }

    res.json({
      totalQuestions,
      activeQuestions,
      totalResults,
      avg,
      high,
      low,
      passedCount,
      failedCount,
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