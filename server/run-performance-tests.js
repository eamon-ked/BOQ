#!/usr/bin/env node

const PerformanceTestSuite = require('./performance-tests');

async function main() {
  console.log('BOQ Builder Database Performance Tests');
  console.log('=====================================\n');
  
  try {
    const testSuite = new PerformanceTestSuite();
    await testSuite.runAllTests();
    
    console.log('\nPerformance tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Performance tests failed:', error);
    process.exit(1);
  }
}

main();