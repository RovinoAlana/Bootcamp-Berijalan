import Joi from "joi";

export const idSchema = Joi.object({
  id: Joi.string().pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'ID must be a number',
    'any.required': 'ID is required'
  })
});

export const createQueueSchema = Joi.object({
  counterId: Joi.number().integer().positive().required().messages({
    'number.base': 'Counter ID must be a number',
    'number.integer': 'Counter ID must be an integer',
    'number.positive': 'Counter ID must be positive',
    'any.required': 'Counter ID is required'
  })
});

export const updateQueueSchema = Joi.object({
  status: Joi.string().valid('claimed', 'called', 'served', 'skipped', 'released').required().messages({
    'any.only': 'Status must be one of: claimed, called, served, skipped, released',
    'any.required': 'Status is required'
  })
});

export const releaseQueueSchema = Joi.object({
  queueId: Joi.number().integer().positive().required().messages({
    'number.base': 'Queue ID must be a number',
    'number.integer': 'Queue ID must be an integer',
    'number.positive': 'Queue ID must be positive',
    'any.required': 'Queue ID is required'
  })
});

export const resetQueueSchema = Joi.object({
  counterId: Joi.number().integer().positive().optional().messages({
    'number.base': 'Counter ID must be a number',
    'number.integer': 'Counter ID must be an integer',
    'number.positive': 'Counter ID must be positive'
  })
});