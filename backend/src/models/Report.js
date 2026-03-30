const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Report must belong to a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    reportType: {
      type: String,
      required: [true, 'Report type is required'],
      enum: {
        values: ['blood_test', 'xray', 'mri', 'ct_scan', 'ultrasound', 'ecg', 'urine_test', 'other'],
        message: 'Invalid report type',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
    },
    reportDate: {
      type: Date,
      required: [true, 'Report date is required'],
    },
    labName: {
      type: String,
      trim: true,
      maxlength: [200, 'Lab name cannot exceed 200 characters'],
    },
    doctorName: {
      type: String,
      trim: true,
      maxlength: [100, 'Doctor name cannot exceed 100 characters'],
    },
    hospitalName: {
      type: String,
      trim: true,
      maxlength: [200, 'Hospital name cannot exceed 200 characters'],
    },
    findings: {
      type: String,
      trim: true,
      maxlength: [5000, 'Findings cannot exceed 5000 characters'],
    },
    conclusion: {
      type: String,
      trim: true,
      maxlength: [2000, 'Conclusion cannot exceed 2000 characters'],
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ user: 1, createdAt: -1 });
reportSchema.index({ reportType: 1 });
reportSchema.index({ reportDate: -1 });

reportSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

reportSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
