const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
  console.log('🧪 Testing Onboardr Backend Endpoints\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test cache status endpoint
    console.log('\n2. Testing cache status endpoint...');
    const cacheResponse = await axios.get(`${BASE_URL}/api/soroswap/cache`);
    console.log('✅ Cache status:', cacheResponse.data);

    // Test TVL endpoint (should be cache miss initially)
    console.log('\n3. Testing TVL endpoint (first call - cache miss)...');
    const tvlResponse1 = await axios.get(`${BASE_URL}/api/soroswap/tvl`);
    console.log('✅ TVL response:', {
      cached: tvlResponse1.data.cached,
      cache_hit: tvlResponse1.data.cache_hit,
      tvl_usd: tvlResponse1.data.tvl_usd,
    });

    // Test TVL endpoint again (should be cache hit)
    console.log('\n4. Testing TVL endpoint (second call - cache hit)...');
    const tvlResponse2 = await axios.get(`${BASE_URL}/api/soroswap/tvl`);
    console.log('✅ TVL response:', {
      cached: tvlResponse2.data.cached,
      cache_hit: tvlResponse2.data.cache_hit,
      tvl_usd: tvlResponse2.data.tvl_usd,
    });

    // Test performance tier flag
    console.log('\n5. Testing performance tier flag...');
    const performanceResponse = await axios.get(`${BASE_URL}/api/soroswap/tvl?performance=large`);
    console.log('✅ Performance tier response:', {
      cached: performanceResponse.data.cached,
      cache_hit: performanceResponse.data.cache_hit,
    });

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEndpoints(); 