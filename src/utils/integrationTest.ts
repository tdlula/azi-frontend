// Simple frontend integration test
async function testFrontendBackendIntegration() {
  console.log('🔍 Testing Frontend-Backend Integration...\n');
  
  const tests = [
    {
      name: 'Chart Prompts Endpoint',
      url: '/api/chart-prompts',
      expectedFields: ['prompts', 'count', 'source']
    },
    {
      name: 'Chart Prompts Statistics',
      url: '/api/chart-prompts/stats',
      expectedFields: ['statistics', 'validation']
    },
    {
      name: 'Dashboard Data',
  url: `${import.meta.env.VITE_PROD_API_BASE_URL || import.meta.env.VITE_DEV_API_BASE_URL || 'http://129.151.191.161:5000'}/api/dashboard-data`,
      expectedFields: ['metrics', 'charts']
    },
    {
      name: 'Suggestions',
      url: '/api/suggestions',
      expectedFields: ['suggestions']
    },
    {
      name: 'Dashboard Data (Force Refresh)',
  url: `${import.meta.env.VITE_PROD_API_BASE_URL || import.meta.env.VITE_DEV_API_BASE_URL || 'http://129.151.191.161:5000'}/api/dashboard-data?force_refresh=true`,
      expectedFields: ['metrics', 'charts']
    }
  ];

  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`📡 Testing: ${test.name}`);
      const response = await fetch(test.url);
      const data = await response.json();
      
      const hasExpectedFields = test.expectedFields.every(field => 
        data.hasOwnProperty(field)
      );
      
      const result = {
        name: test.name,
        url: test.url,
        status: response.status,
        ok: response.ok,
        hasExpectedFields,
        dataPreview: {
          chartCount: data.charts ? Object.keys(data.charts).length : 0,
          promptCount: data.prompts?.length || data.count || 0,
          suggestionsCount: data.suggestions?.length || 0,
          totalStats: data.statistics?.total || 0
        }
      };
      
      results.push(result);
      
      if (result.ok && result.hasExpectedFields) {
        console.log(`✅ ${test.name} - OK`);
        if (result.dataPreview.chartCount > 0) {
          console.log(`   📊 Charts: ${result.dataPreview.chartCount}`);
        }
        if (result.dataPreview.promptCount > 0) {
          console.log(`   📋 Prompts: ${result.dataPreview.promptCount}`);
        }
        if (result.dataPreview.suggestionsCount > 0) {
          console.log(`   💡 Suggestions: ${result.dataPreview.suggestionsCount}`);
        }
        if (result.dataPreview.totalStats > 0) {
          console.log(`   📈 Stats Total: ${result.dataPreview.totalStats}`);
        }
      } else {
        console.log(`❌ ${test.name} - Failed`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Expected fields: ${test.expectedFields.join(', ')}`);
        console.log(`   Missing fields: ${test.expectedFields.filter(field => !data.hasOwnProperty(field)).join(', ')}`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ ${test.name} - Error: ${errorMessage}`);
      results.push({
        name: test.name,
        url: test.url,
        status: 0,
        ok: false,
        error: errorMessage
      });
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Summary
  console.log('📊 Integration Test Summary:');
  const passedTests = results.filter(r => r.ok).length;
  const totalTests = results.length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All integration tests passed! Frontend-backend integration is working properly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check backend server status and API endpoints.');
  }
  
  // Check for chart system optimization
  const dashboardTest = results.find(r => r.name === 'Dashboard Data');
  if (dashboardTest && 'dataPreview' in dashboardTest && dashboardTest.dataPreview.chartCount >= 6) {
    console.log('\n📈 Chart system optimization: EXCELLENT (6+ charts using new system)');
  } else if (dashboardTest && 'dataPreview' in dashboardTest && dashboardTest.dataPreview.chartCount >= 3) {
    console.log('\n📈 Chart system optimization: GOOD (3+ charts, may use fallback)');
  } else {
    console.log('\n📈 Chart system optimization: NEEDS IMPROVEMENT (force refresh recommended)');
  }
  
  return results;
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('🚀 Frontend-Backend Integration Test Ready');
  console.log('📝 Run: testFrontendBackendIntegration()');
  
  // Make function globally available
  (window as any).testFrontendBackendIntegration = testFrontendBackendIntegration;
  (window as any).testIntegration = testFrontendBackendIntegration; // Shorter alias
}

export { testFrontendBackendIntegration };
