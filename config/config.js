module.exports = {
  development: {
    username: process.env.DATABASE_USER || process.env.USER,
    password: process.env.DATABASE_PASSWORD,
    database: 'hentak_development',
    host: '127.0.0.1',
    dialect: 'postgres'
  },
  test: {
    username: root,
    password: null,
    database: 'hentak_test',
    host: '127.0.0.1',
    dialect: 'postgres'
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false
  }
};
