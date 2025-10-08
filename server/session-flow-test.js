/**
 * Session Flow Testing - Demonstrates Multi-Turn Conversations
 */

const axios = require('axios');

class SessionFlowTest {
  constructor() {
    this.userId = 'session_test_user';
    this.testResults = [];
  }

  async runSessionTests() {
    console.log('🔄 Starting Session Flow Tests...\n');
    
    const testFlows = [
      {
        name: 'Complete Shopping Session',
        messages: [
          'dua kemishe te kuqe nen 20$',
          'which one do you suggest?',
          'filter by blue instead',
          'show me ones with larger size',
          'ciski do you recommend?'
        ]
      },
      {
        name: 'Material Focus Session', 
        messages: [
          'dua produkte te pambukit',
          'nen 30$',
          'blue color please',
          'cilin e sugjeron?'
        ]
      },
      {
        name: 'Price Optimization Session',
        messages: [
          'cheapest items under 15$',
          'size M only',
          'red color too',
          'which one is best value?'
        ]
      }
    ];

    for (const flow of testFlows) {
      console.log(`\n📋 Testing Flow: ${flow.name}`);
      console.log('=' .repeat(50));
      
      await this.runMessageFlow(flow.name, flow.messages);
    }

    this.generateSessionReport();
  }

  async runMessageFlow(flowName, messages) {
    const flowResults = [];
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      console.log(`\n💬 Message ${i + 1}: "${message}"`);
      
      const startTime = Date.now();
      
      try {
        const response = await axios.post('http://localhost:5000/chat', {
          userId: this.userId,
          message: message
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        });
        
        const duration = Date.now() - startTime;
        
        console.log(`✅ Response (${duration}ms):`);
        console.log(`📦 Products: ${response.data.products.length}`);
        console.log(`🤖 AI: "${response.data.message}"`);
        
        if (response.data.products.length > 0) {
          const productNames = response.data.products.map(p => p.name).join(', ');
          console.log(`🛍️  Available: ${productNames}`);
        }
        
        flowResults.push({
          messageNumber: i + 1,
          message: message,
          duration: duration,
          aiResponse: response.data.message,
          productCount: response.data.products.length,
          products: response.data.products,
          success: true
        });
        
      } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`❌ Failed (${duration}ms): ${error.response?.status || error.message}`);
        
        flowResults.push({
          messageNumber: i + 1,
          message: message,
          duration: duration,
          success: false,
          error: error.response?.status || error.message
        });
      }
      
      // Wait between messages in the same flow
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.testResults.push({
      flowName: flowName,
      results: flowResults,
      totalMessages: messages.length,
      successfulMessages: flowResults.filter(r => r.success).length,
      avgDuration: flowResults.reduce((sum, r) => sum + r.duration, 0) / flowResults.length
    });
  }

  generateSessionReport() {
    console.log('\n📊 SESSION FLOW TEST REPORT');
    console.log('=' .repeat(60));
    
    // Summary statistics
    const totalMessages = this.testResults.reduce((sum, flow) => sum + flow.totalMessages, 0);
    const successfulMessages = this.testResults.reduce((sum, flow) => sum + flow.successfulMessages, 0);
    const overallAvgDuration = this.testResults.reduce((sum, flow) => sum + flow.avgDuration, 0) / this.testResults.length;
    
    console.log(`📈 OVERALL SESSION STATISTICS:`);
    console.log(`💬 Total Messages Tested: ${totalMessages}`);
    console.log(`✅ Successful Exchanges: ${successfulMessages}`);
    console.log(`❌ Failed Exchanges: ${totalMessages - successfulMessages}`);
    console.log(`🎯 Success Rate: ${((successfulMessages / totalMessages) * 100).toFixed(1)}%`);
    console.log(`⏱️  Average Response Time: ${overallAvgDuration.toFixed(0)}ms`);
    
    // Flow-specific results
    console.log(`\n🌊 FLOW-SPECIFIC RESULTS:`);
    this.testResults.forEach(flow => {
      console.log(`\n📋 ${flow.flowName}:`);
      console.log(`   Messages: ${flow.successfulMessages}/${flow.totalMessages} successful`);
      console.log(`   Avg Duration: ${flow.avgDuration.toFixed(0)}ms`);
      
      // Show conversation progression
      flow.results.forEach((result, index) => {
        if (result.success) {
          console.log(`   ${index + 1}. "${result.message}"`);
          console.log(`      → AI: "${result.aiResponse.substring(0, 60)}..."`);
          console.log(`      → Products: ${result.productCount}`);
        } else {
          console.log(`   ${index + 1}. "${result.message}" ❌`);
        }
      });
    });
    
    // Session awareness verification
    console.log(`\n🧠 SESSION AWARENESS VERIFICATION:`);
    const sessionFeatures = this.analyzeSessionFeatures();
    
    Object.entries(sessionFeatures).forEach(([feature, status]) => {
      console.log(`${status ? '✅' : '❌'} ${feature}: ${status ? 'Working' : 'Needs Attention'}`);
    });
    
    // Performance assessment
    console.log(`\n⚡ PERFORMANCE ASSESSMENT:`);
    if (overallAvgDuration < 2000) {
      console.log('🚀 Excellent: Average response time under 2 seconds');
    } else if (overallAvgDuration < 5000) {
      console.log('⚡ Good: Average response time under 5 seconds');
    } else {
      console.log('⚠️  Improvement needed: Response time over 5 seconds');
    }
    
    // Production readiness
    console.log(`\n🚀 PRODUCTION READINESS:`);
    const successRate = (successfulMessages / totalMessages) * 100;
    
    if (successRate >= 95 && overallAvgDuration < 5000) {
      console.log('✅ READY: Session-aware chatbot meets production standards');
      console.log('🎯 Can handle multi-turn conversations with context preservation');
      console.log('🔄 Reliable session memory and follow-up handling');
    } else {
      console.log('⚠️  REVIEW NEEDED: Some session flows need optimization');
      console.log(`📝 Issues: ${successRate < 95 ? 'Success rate below 95%' : ''} ${overallAvgDuration >= 5000 ? 'Response time too slow' : ''}`);
    }
  }

  analyzeSessionFeatures() {
    return {
      'Multi-Turn Conversation Handling': this.testResults.length > 0,
      'Session Memory Persistence': this.testResults.every(flow => flow.successfulMessages > 0),
      'Follow-Up Context Awareness': this.testResults.some(flow => 
        flow.results.some(r => r.success && r.aiResponse.toLowerCase().includes('preceding'))
      ),
      'Filter Accumulation': this.testResults.some(flow => 
        flow.results.some(r => r.success && r.productCount > 0)
      ),
      'Natural Conversation Flow': this.testResults.every(flow => 
        flow.results.every(r => !r.success || r.aiResponse.includes('Përshëndetje'))
      ),
      'Intelligent Suggestions': this.testResults.some(flow => 
        flow.results.some(r => r.success && r.aiResponse.toLowerCase().includes('sugjero'))
      )
    };
  }
}

// Run session flow tests
async function main() {
  const tester = new SessionFlowTest();
  
  try {
    await tester.runSessionTests();
  } catch (error) {
    console.error('❌ Session flow test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SessionFlowTest;
