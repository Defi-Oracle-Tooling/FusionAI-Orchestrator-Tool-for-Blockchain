# AI Agent Tests

This directory contains tests for the AI agents in the FusionAI Orchestrator Tool.

## Test Files

- `MockAgent.test.ts`: A simplified test file that doesn't require external dependencies. It tests the basic structure and interfaces of our AI agents.

## Running Tests

To run the tests, use the following command:

```bash
node src/tests/runTests.js
```

This will compile the TypeScript files and run the tests.

## Test Structure

The tests are designed to validate:

1. Agent initialization
2. Agent capabilities
3. Basic agent functionality

## Future Improvements

For more comprehensive testing, consider:

1. Adding Jest for more robust testing
2. Implementing proper mocking for external dependencies
3. Adding integration tests with blockchain adapters
4. Setting up CI/CD pipeline for automated testing

## Notes

- These tests are designed to be lightweight and not require external dependencies
- They focus on validating the structure and interfaces of the AI agents
- For production, use environment variables for API keys and other sensitive information
