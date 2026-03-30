const Joi = require('joi');

const createReportSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title cannot exceed 200 characters',
    'any.required': 'Title is required',
  }),
  reportType: Joi.string()
    .valid('blood_test', 'xray', 'mri', 'ct_scan', 'ultrasound', 'ecg', 'urine_test', 'other')
    .required()
    .messages({
      'any.only': 'Invalid report type',
      'any.required': 'Report type is required',
    }),
  description: Joi.string().max(2000).allow('').messages({
    'string.max': 'Description cannot exceed 2000 characters',
  }),
  reportDate: Joi.date().iso().required().messages({
    'date.format': 'Report date must be a valid date',
    'any.required': 'Report date is required',
  }),
  labName: Joi.string().max(200).allow('').messages({
    'string.max': 'Lab name cannot exceed 200 characters',
  }),
  doctorName: Joi.string().max(100).allow('').messages({
    'string.max': 'Doctor name cannot exceed 100 characters',
  }),
  hospitalName: Joi.string().max(200).allow('').messages({
    'string.max': 'Hospital name cannot exceed 200 characters',
  }),
  findings: Joi.string().max(5000).allow('').messages({
    'string.max': 'Findings cannot exceed 5000 characters',
  }),
  conclusion: Joi.string().max(2000).allow('').messages({
    'string.max': 'Conclusion cannot exceed 2000 characters',
  }),
  isPrivate: Joi.boolean().default(true),
  tags: Joi.array().items(Joi.string().max(50)).max(10).messages({
    'array.max': 'Maximum 10 tags allowed',
  }),
});

const updateReportSchema = Joi.object({
  title: Joi.string().min(3).max(200).messages({
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title cannot exceed 200 characters',
  }),
  reportType: Joi.string()
    .valid('blood_test', 'xray', 'mri', 'ct_scan', 'ultrasound', 'ecg', 'urine_test', 'other')
    .messages({
      'any.only': 'Invalid report type',
    }),
  description: Joi.string().max(2000).allow('').messages({
    'string.max': 'Description cannot exceed 2000 characters',
  }),
  reportDate: Joi.date().iso().messages({
    'date.format': 'Report date must be a valid date',
  }),
  labName: Joi.string().max(200).allow('').messages({
    'string.max': 'Lab name cannot exceed 200 characters',
  }),
  doctorName: Joi.string().max(100).allow('').messages({
    'string.max': 'Doctor name cannot exceed 100 characters',
  }),
  hospitalName: Joi.string().max(200).allow('').messages({
    'string.max': 'Hospital name cannot exceed 200 characters',
  }),
  findings: Joi.string().max(5000).allow('').messages({
    'string.max': 'Findings cannot exceed 5000 characters',
  }),
  conclusion: Joi.string().max(2000).allow('').messages({
    'string.max': 'Conclusion cannot exceed 2000 characters',
  }),
  isPrivate: Joi.boolean(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).messages({
    'array.max': 'Maximum 10 tags allowed',
  }),
});

module.exports = { createReportSchema, updateReportSchema };
