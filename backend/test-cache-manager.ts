import { initializeCacheSystem } from './services/cache/CacheManager';
import { logger } from './services/logger';

async function testCacheManager() {
  try {
    console.log('Testing Cache Manager import and initialization...');
    
    // Test the initializeCacheSystem function
    const result = await initializeCacheSystem();
    
    console.log('Cache initialization result:', {
      success: result.success,
      services: result.services,
      errors: result.errors,
      warnings: result.warnings,
      metrics: result.metrics
    });

    if (result.success) {
      console.log('✅ Cache Manager implementation is working correctly!');
    } else {
      console.log('❌ Cache Manager initialization failed');
      console.log('Errors:', result.errors);
      console.log('Warnings:', result.warnings);
    }

  } catch (error) {
    console.error('❌ Error testing Cache Manager:', error);
  }
}

// Run the test
testCacheManager().then(() => {
  console.log('Cache Manager test completed');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
