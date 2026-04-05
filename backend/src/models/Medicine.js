const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    rxcui: {
      type: String,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      trim: true,
      index: true,
    },
    brandNames: [{
      type: String,
      trim: true,
    }],
    category: {
      type: String,
      index: true,
    },
    drugClass: {
      type: String,
    },
    atcCode: {
      type: String,
    },
    indications: [{
      type: String,
    }],
    contraindications: [{
      type: String,
    }],
    sideEffects: [{
      name: String,
      frequency: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
      },
    }],
    warnings: [{
      type: String,
    }],
    dosageForms: [{
      form: String,
      strengths: [String],
    }],
    fdaRecall: {
      type: Boolean,
      default: false,
    },
    recallInfo: {
      type: String,
    },
    pregnancyCategory: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'X', 'N'],
    },
    source: {
      type: String,
      enum: ['rxnorm', 'openfda', 'custom', 'hybrid'],
      default: 'rxnorm',
    },
    syncedAt: {
      type: Date,
    },
    isIndianBrand: {
      type: Boolean,
      default: false,
    },
    linkedRxcui: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

medicineSchema.index({ name: 'text', genericName: 'text', brandNames: 'text' });
medicineSchema.index({ category: 1, name: 1 });
medicineSchema.index({ rxcui: 1 }, { unique: true, sparse: true });

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;
