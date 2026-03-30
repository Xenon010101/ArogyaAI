const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    symptoms: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    triageResult: {
      isEmergency: { type: Boolean, default: false },
      severity: { type: String, enum: ['none', 'low', 'moderate', 'high', 'critical'] },
      flags: [
        {
          type: String,
          keyword: String,
          severity: String,
          message: String,
        },
      ],
      recommendation: {
        action: String,
        instruction: String,
        urgency: String,
      },
    },
    aiAnalysis: {
      risk_level: String,
      summary: String,
      conditions: [String],
      recommendations: [String],
      red_flags: [String],
      confidence: Number,
    },
    combinedRiskLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      required: true,
    },
    files: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number,
      },
    ],
    userContext: {
      age: Number,
      gender: String,
      medicalHistory: [String],
    },
    status: {
      type: String,
      enum: ['completed', 'failed', 'pending'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

analysisSchema.index({ user: 1, createdAt: -1 });
analysisSchema.index({ combinedRiskLevel: 1 });

const Analysis = mongoose.model('Analysis', analysisSchema);

module.exports = Analysis;
