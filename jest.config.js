module.exports = {
  preset: 'react-native',
  rootDir: '.',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', '<rootDir>/src/__mocks__/jest.setup.js'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@(.*)$': '<rootDir>/src/$1',
  },
};
