import ExamResult from '../models/ExamResult.js';

// Create a new exam result (For Students - No protection needed)
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

    await newResult.save();

    // Return a simple success message without exposing full results
    res.status(201).json({ message: 'Exam submitted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
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

// Get a single exam result by ID (with detailed answers summary)
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

// Delete all exam results (clear history)
export const deleteAllResults = async (req, res) => {
  try {
    await ExamResult.deleteMany({});
    res.json({ message: 'All exam results cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};