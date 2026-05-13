export default {
  testEnvironment: 'node',
  verbose: true,

  testMatch: ['**/tests/**/*Test.js'],

  collectCoverageFrom: [
    'src/modules/**/*Service.js',
    'src/modules/**/*Validation.js',
    'src/utils/**/*.js',
    'src/middlewares/*Middleware.js',
    '!src/server.js',
    '!src/app.js',
  ],

  coveragePathIgnorePatterns: ['/node_modules/'],

  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60,
    },
  },
};