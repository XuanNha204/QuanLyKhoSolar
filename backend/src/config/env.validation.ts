import Joi from 'joi';

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3001),
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('8h'),
  CORS_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
  BCRYPT_ROUNDS: Joi.number().integer().min(8).max(14).default(10),
  SEED_ALLOW_RESET: Joi.boolean().truthy('true').falsy('false').default(false),
}).unknown(true);

export function validateEnvironment(config: Record<string, unknown>) {
  const { error, value } = schema.validate(config, { abortEarly: false });
  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }
  return value as Record<string, unknown>;
}
