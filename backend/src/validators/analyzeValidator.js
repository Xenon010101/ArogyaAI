const Joi = require('joi');

const analyzeSchema = Joi.object({
  symptoms: Joi.string().min(5).max(5000).required().messages({
    'string.empty': 'Symptoms description is required',
    'string.min': 'Please provide more details about your symptoms',
    'string.max': 'Symptoms description cannot exceed 5000 characters',
    'any.required': 'Symptoms description is required',
  }),
  age: Joi.number().integer().min(0).max(150).messages({
    'number.min': 'Age must be a positive number',
    'number.max': 'Please enter a valid age',
  }),
  gender: Joi.string().valid('male', 'female', 'other').messages({
    'any.only': 'Gender must be male, female, or other',
  }),
  medicalHistory: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()),
      Joi.string()
    )
    .messages({
      'string.base': 'Medical history must be a string or array',
    }),
});

const preCheckSchema = Joi.object({
  symptoms: Joi.string().min(5).required().messages({
    'string.empty': 'Symptoms description is required',
    'string.min': 'Please provide more details about your symptoms',
    'any.required': 'Symptoms description is required',
  }),
});

module.exports = { analyzeSchema, preCheckSchema };
