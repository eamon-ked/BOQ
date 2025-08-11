const DatabaseService = require('./database');

class PerformanceTestSuite {
  constructor() {
    this.db = new DatabaseService();
    this.testResults = [];
  }

  async runAllTests() {
    console.log('Starting database performance tests...\n');
    
    // Test 1: Basic item retrieval
    await this.testItemRetrieval();
    
    // Test 2: Category-based filtering
    await this.testCategoryFiltering();
    
    // Test 3: Search functionality
    await this.testSearchPerformance();
    
    // Test 4: BOQ operations
    await this.testBOQOperations();
    
    // Test 5: Complex joins
    await this.testComplexJoins();
    
    // Test 6: Index effectiveness
    await this.testIndexEffectiveness();
    
    this.generateReport();
    this.db.close();
  }

  async testItemRetrieval() {
    console.log('Testing item retrieval performance...');
    
    const result = this.db.runPerformanceTest(
      'Basic Item Retrieval',
      () => this.db.getItems(),
      50
    );
    
    this.testResults.push(result);
    console.log(`Average time: ${result.avgTime.toFixed(2)}ms`);
    console.log(`Min/Max: ${result.minTime.toFixed(2)}ms / ${result.maxTime.toFixed(2)}ms\n`);
  }

  async testCategoryFiltering() {
    console.log('Testing category filtering performance...');
    
    const categories = this.db.getCategories();
    const testCategory = categories[0];
    
    const result = this.db.runPerformanceTest(
      'Category Filtering',
      () => this.db.getItemsByCategory(testCategory),
      100
    );
    
    this.testResults.push(result);
    console.log(`Average time: ${result.avgTime.toFixed(2)}ms`);
    console.log(`Min/Max: ${result.minTime.toFixed(2)}ms / ${result.maxTime.toFixed(2)}ms\n`);
  }

  async testSearchPerformance() {
    console.log('Testing search performance...');
    
    const searchTerms = ['camera', 'cable', 'power', 'network'];
    
    for (const term of searchTerms) {
      const result = this.db.runPerformanceTest(
        `Search: "${term}"`,
        () => this.db.searchItems(term),
        50
      );
      
      this.testResults.push(result);
      console.log(`Search "${term}" - Average: ${result.avgTime.toFixed(2)}ms`);
    }
    console.log();
  }

  async testBOQOperations() {
    console.log('Testing BOQ operations performance...');
    
    // Test BOQ project retrieval
    const projectResult = this.db.runPerformanceTest(
      'BOQ Projects Retrieval',
      () => this.db.getBOQProjects(),
      100
    );
    
    this.testResults.push(projectResult);
    console.log(`BOQ Projects - Average: ${projectResult.avgTime.toFixed(2)}ms`);
    
    // Test BOQ items retrieval (if projects exist)
    const projects = this.db.getBOQProjects();
    if (projects.length > 0) {
      const itemsResult = this.db.runPerformanceTest(
        'BOQ Items Retrieval',
        () => this.db.getBOQItems(projects[0].id),
        100
      );
      
      this.testResults.push(itemsResult);
      console.log(`BOQ Items - Average: ${itemsResult.avgTime.toFixed(2)}ms`);
    }
    console.log();
  }

  async testComplexJoins() {
    console.log('Testing complex join performance...');
    
    // Test the complex query with multiple joins
    const result = this.db.runPerformanceTest(
      'Complex Joins (Items with Dependencies)',
      () => {
        const stmt = this.db.db.prepare(`
          SELECT i.*, 
                 COUNT(d.dependency_id) as dependency_count,
                 GROUP_CONCAT(dep.name) as dependency_names
          FROM items i
          LEFT JOIN dependencies d ON i.id = d.item_id
          LEFT JOIN items dep ON d.dependency_id = dep.id
          GROUP BY i.id
          ORDER BY dependency_count DESC
          LIMIT 50
        `);
        return stmt.all();
      },
      50
    );
    
    this.testResults.push(result);
    console.log(`Complex Joins - Average: ${result.avgTime.toFixed(2)}ms`);
    console.log(`Min/Max: ${result.minTime.toFixed(2)}ms / ${result.maxTime.toFixed(2)}ms\n`);
  }

  async testIndexEffectiveness() {
    console.log('Testing index effectiveness...');
    
    // Test queries that should benefit from indexes
    const indexTests = [
      {
        name: 'Category Index',
        query: () => {
          const stmt = this.db.db.prepare('SELECT * FROM items WHERE category = ? ORDER BY name');
          return stmt.all('CCTV');
        }
      },
      {
        name: 'Price Range Index',
        query: () => {
          const stmt = this.db.db.prepare('SELECT * FROM items WHERE unit_price BETWEEN ? AND ? ORDER BY unit_price');
          return stmt.all(100, 500);
        }
      },
      {
        name: 'Name Search Index',
        query: () => {
          const stmt = this.db.db.prepare('SELECT * FROM items WHERE name LIKE ? ORDER BY name');
          return stmt.all('%camera%');
        }
      },
      {
        name: 'Manufacturer Index',
        query: () => {
          const stmt = this.db.db.prepare('SELECT * FROM items WHERE manufacturer = ? ORDER BY name');
          return stmt.all('Hikvision');
        }
      }
    ];

    for (const test of indexTests) {
      const result = this.db.runPerformanceTest(test.name, test.query, 100);
      this.testResults.push(result);
      console.log(`${test.name} - Average: ${result.avgTime.toFixed(2)}ms`);
    }
    console.log();
  }

  generateReport() {
    console.log('='.repeat(60));
    console.log('PERFORMANCE TEST REPORT');
    console.log('='.repeat(60));
    
    // Overall statistics
    const totalTests = this.testResults.length;
    const totalIterations = this.testResults.reduce((sum, r) => sum + r.iterations, 0);
    const avgTestTime = this.testResults.reduce((sum, r) => sum + r.avgTime, 0) / totalTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Total Iterations: ${totalIterations}`);
    console.log(`Average Test Time: ${avgTestTime.toFixed(2)}ms\n`);
    
    // Performance thresholds
    const FAST_THRESHOLD = 10; // ms
    const ACCEPTABLE_THRESHOLD = 50; // ms
    const SLOW_THRESHOLD = 100; // ms
    
    console.log('Test Results:');
    console.log('-'.repeat(60));
    
    this.testResults.forEach(result => {
      let status = '✅ FAST';
      if (result.avgTime > SLOW_THRESHOLD) {
        status = '❌ SLOW';
      } else if (result.avgTime > ACCEPTABLE_THRESHOLD) {
        status = '⚠️  ACCEPTABLE';
      } else if (result.avgTime > FAST_THRESHOLD) {
        status = '✅ GOOD';
      }
      
      console.log(`${result.testName.padEnd(30)} | ${result.avgTime.toFixed(2)}ms | ${status}`);
    });
    
    console.log('\nPerformance Requirements Check:');
    console.log('-'.repeat(60));
    
    // Check against requirements
    const slowQueries = this.testResults.filter(r => r.avgTime > 100);
    const acceptableQueries = this.testResults.filter(r => r.avgTime <= 100);
    
    console.log(`✅ Queries under 100ms: ${acceptableQueries.length}/${totalTests}`);
    if (slowQueries.length > 0) {
      console.log(`❌ Slow queries (>100ms): ${slowQueries.length}`);
      slowQueries.forEach(q => {
        console.log(`   - ${q.testName}: ${q.avgTime.toFixed(2)}ms`);
      });
    }
    
    // Query statistics from database
    console.log('\nDatabase Query Statistics:');
    console.log('-'.repeat(60));
    const queryStats = this.db.getQueryStats();
    Object.entries(queryStats).forEach(([queryName, stats]) => {
      console.log(`${queryName.padEnd(25)} | Calls: ${stats.count.toString().padStart(4)} | Avg: ${stats.avgTime.toFixed(2)}ms`);
    });
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new PerformanceTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = PerformanceTestSuite;