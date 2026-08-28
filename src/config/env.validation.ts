import Joi from 'joi';

const schema = Joi.object<Record<string, unknown>>({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  CORS_ORIGINS: Joi.string().allow('').default(''),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
  EXCEL_MAX_FILE_SIZE_MB: Joi.number().positive().default(5),
  EXCEL_MAX_ROWS: Joi.number().integer().min(1).max(10000).default(2000),
  IMPORT_RATE_LIMIT_TTL: Joi.number().integer().min(1000).default(60000),
  IMPORT_RATE_LIMIT_LIMIT: Joi.number().integer().min(1).default(10),
}).unknown(true);

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const result = schema.validate(config, { abortEarly: false });
  if (result.error) throw new Error(`环境变量配置错误: ${result.error.message}`);
  return result.value;
}
