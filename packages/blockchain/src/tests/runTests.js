// Simple script to run the MockBlockchainAdapter.test.ts file
// Usage: node runTests.js

const { exec } = require('child_process');
const path = require('path');

console.log('Running Blockchain Adapter tests...');

// Compile TypeScript file to JavaScript
exec('npx tsc src/tests/MockBlockchainAdapter.test.ts --esModuleInterop --skipLibCheck', (error, stdout, stderr) => {
  if (error) {
    console.error('Error compiling TypeScript file:', error);
    console.error(stderr);
    return;
  }
  
  console.log('TypeScript compilation successful');
  
  // Run the compiled JavaScript file
  exec('node src/tests/MockBlockchainAdapter.test.js', (error, stdout, stderr) => {
    if (error) {
      console.error('Error running tests:', error);
      console.error(stderr);
      return;
    }
    
    console.log(stdout);
    console.log('Tests completed successfully');
  });
});
