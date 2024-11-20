module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js'],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    setupFilesAfterEnv: ['./src/test/setup.js'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/config/',
        '/test/',
        '/coverage/'
    ],
    coverageReporters: ['text', 'lcov', 'clover', 'html'],
    moduleFileExtensions: ['js', 'json'],
    testPathIgnorePatterns: ['/node_modules/']
};
