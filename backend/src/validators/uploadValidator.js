const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/jpg',
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

const Joi = require('joi');

const uploadFilesSchema = Joi.object({
  images: Joi.array()
    .items(
      Joi.object({
        originalname: Joi.string().required(),
        mimetype: Joi.string()
          .valid(...ALLOWED_TYPES)
          .required(),
        size: Joi.number()
          .max(5 * 1024 * 1024)
          .required(),
      })
    )
    .max(5)
    .optional(),
  prescriptions: Joi.array()
    .items(
      Joi.object({
        originalname: Joi.string().required(),
        mimetype: Joi.string()
          .valid(...ALLOWED_TYPES)
          .required(),
        size: Joi.number()
          .max(5 * 1024 * 1024)
          .required(),
      })
    )
    .max(3)
    .optional(),
});

module.exports = {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLLOWED_TYPES,
  uploadFilesSchema,
};
