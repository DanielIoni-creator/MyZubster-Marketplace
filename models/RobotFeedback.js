const mongoose = require('mongoose');

const RobotFeedbackSchema = new mongoose.Schema({
  feedbackId: { type: String, required: true, unique: true, index: true },
  robotId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  jobId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Reputation calculation: weighted score based on ratings, completed jobs, disputes
RobotFeedbackSchema.statics.getReputation = async function(robotId) {
  const feedbacks = await this.find({ robotId });
  const total = feedbacks.length;
  if (total === 0) return { score: 0, badge: 'Newcomer', totalJobs: 0, avgRating: 0 };

  const avgRating = feedbacks.reduce((s, f) => s + f.rating, 0) / total;
  // Score: avg rating * 20 + bonus for volume (min(total, 50) * 0.4)
  const score = Math.round((avgRating * 20) + (Math.min(total, 50) * 0.4));
  const badge = score >= 95 ? 'Platinum' : score >= 80 ? 'Gold' : score >= 60 ? 'Silver' : score >= 30 ? 'Bronze' : 'Newcomer';

  return { score, badge, totalJobs: total, avgRating: Math.round(avgRating * 10) / 10 };
};

module.exports = mongoose.model('RobotFeedback', RobotFeedbackSchema);
