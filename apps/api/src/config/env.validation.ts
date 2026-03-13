import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  DATABASE_SSL: Joi.string().valid('true', 'false').default('false'),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('8h'),
  AZURE_AD_TENANT_ID: Joi.string().allow('').default(''),
  AZURE_AD_CLIENT_ID: Joi.string().allow('').default(''),
  AZURE_AD_CLIENT_SECRET: Joi.string().allow('').default(''),
  AZURE_AD_AUDIENCE: Joi.string().allow('').default(''),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  APPLICATIONINSIGHTS_CONNECTION_STRING: Joi.string().allow('').default(''),
  REDIS_URL: Joi.string().allow('').default(''),
});
