const mongoose = require('mongoose');

/**
 * RobotFeedback - Bounty BOT-6 (#343)
 *
 * Un feedback lasciato da un cliente su un job svolto da un robot.
 * La reputazione è derivata da questi documenti, mai scritta a mano.
 */
const RobotFeedbackSchema = new mongoose.Schema({
  robotId: { type: String, required: true, index: true },
  clientId: { type: String, required: true, index: true },
  // Il job a cui il feedback si riferisce: un cliente può valutare un robot
  // una sola volta per job (indice unico più sotto).
  jobId: { type: String, required: true, index: true },

  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: null, maxlength: 1000 },

  // Un feedback lasciato dopo una disputa pesa di più nel calcolo, perché
  // segnala un problema reale e non una semplice preferenza.
  disputed: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now, index: true }
});

RobotFeedbackSchema.index({ robotId: 1, createdAt: -1 });
// Un solo feedback per (robot, job, cliente): impedisce di gonfiare o
// affossare la reputazione con voti ripetuti sullo stesso lavoro.
RobotFeedbackSchema.index({ robotId: 1, jobId: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model('RobotFeedback', RobotFeedbackSchema);
