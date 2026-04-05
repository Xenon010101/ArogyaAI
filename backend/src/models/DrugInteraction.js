const mongoose = require('mongoose');

const drugInteractionSchema = new mongoose.Schema(
  {
    drug1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true,
    },
    drug2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true,
    },
    drug1Name: {
      type: String,
      required: true,
      index: true,
    },
    drug2Name: {
      type: String,
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['high', 'moderate', 'low', 'unknown'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    recommendation: {
      type: String,
    },
    clinicalEffects: [{
      type: String,
    }],
    management: {
      type: String,
    },
    source: {
      type: String,
      enum: ['drugbank', 'openfda', 'custom', 'clinical'],
      default: 'custom',
    },
    evidenceLevel: {
      type: String,
      enum: ['established', 'probable', 'suspected', 'theoretical'],
      default: 'probable',
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

drugInteractionSchema.index({ drug1: 1, drug2: 1 }, { unique: true });
drugInteractionSchema.index({ drug1Name: 'text', drug2Name: 'text' });
drugInteractionSchema.index({ severity: 1, verified: 1 });

const DrugInteraction = mongoose.model('DrugInteraction', drugInteractionSchema);

module.exports = DrugInteraction;
