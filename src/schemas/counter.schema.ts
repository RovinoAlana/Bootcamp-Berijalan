import Joi from "joi";

// Schema untuk ID parameter
export const idSchema = Joi.object({
  id: Joi.string().pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'ID must be a number',
    'any.required': 'ID is required'
  })
});

// Schema untuk create counter
export const createCounterSchema = Joi.object({
  name: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 1 character',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  maxQueue: Joi.number().integer().min(1).max(999).optional().messages({
    'number.base': 'Max queue must be a number',
    'number.integer': 'Max queue must be an integer',
    'number.min': 'Max queue must be at least 1',
    'number.max': 'Max queue cannot exceed 999'
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean'
  })
});

// Schema untuk update counter
export const updateCounterSchema = Joi.object({
  name: Joi.string().min(1).max(50).optional().messages({
    'string.empty': 'Name cannot be empty',
    'string.min': 'Name must be at least 1 character',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  currentQueue: Joi.number().integer().min(0).max(999).optional().messages({
    'number.base': 'Current queue must be a number',
    'number.integer': 'Current queue must be an integer',
    'number.min': 'Current queue cannot be negative',
    'number.max': 'Current queue cannot exceed 999'
  }),
  maxQueue: Joi.number().integer().min(1).max(999).optional().messages({
    'number.base': 'Max queue must be a number',
    'number.integer': 'Max queue must be an integer',
    'number.min': 'Max queue must be at least 1',
    'number.max': 'Max queue cannot exceed 999'
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean'
  })
});

// Schema untuk update counter status
export const counterStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'disable').required().messages({
    'any.only': 'Status must be one of: active, inactive, disable',
    'any.required': 'Status is required'
  })
});

// Schema untuk query parameters (opsional)
export const counterQuerySchema = Joi.object({
  includeDeleted: Joi.boolean().optional().messages({
    'boolean.base': 'includeDeleted must be a boolean'
  })
});