const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema(
  {
    icdCode: {
      type: String,
      required: true,
    },
    icdCodeFull: {
      type: String,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      index: true,
    },
    chapter: {
      type: String,
    },
    symptoms: [{
      type: String,
      index: true,
    }],
    riskFactors: [{
      type: String,
    }],
    treatments: [{
      type: String,
    }],
    specialists: [{
      type: String,
    }],
    severity: {
      type: String,
      enum: ['chronic', 'acute', 'emergency', 'routine'],
      index: true,
    },
    isReportable: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ['who', 'custom', 'icd10data'],
      default: 'who',
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

conditionSchema.index({ name: 'text', symptoms: 'text' });
conditionSchema.index({ icdCode: 1 }, { unique: true });
conditionSchema.index({ category: 1, severity: 1 });

const Condition = mongoose.model('Condition', conditionSchema);

module.exports = Condition;
