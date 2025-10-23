import { ParsedFilters } from './MessageParser';

export interface Product {
  id: string;
  name: string;
  price: number;
  color: string;
  size: string;
  material: string;
  brand?: string;
  _source?: string;
  tracking_id?: string;
  categories?: string[];
  images?: string[];
}

export interface SessionContext {
  userId: string;
  lastCategory?: string;
  appliedFilters?: ParsedFilters;
  lastProducts?: Product[];
  messageHistory: string[];
  timestamp: number;
}

export class SessionManager {
  private sessions: Map<string, SessionContext> = new Map();

  /**
   * Get existing session or create new one with defaults
   */
  getSession(userId: string): SessionContext {
    let session = this.sessions.get(userId);
    
    if (!session) {
      // Create new session with defaults
      session = {
        userId,
        messageHistory: [],
        timestamp: Date.now()
      };
      this.sessions.set(userId, session);
    }
    
    return session;
  }

  /**
   * Update session with new data, merging into existing session
   */
  updateSession(userId: string, updates: Partial<SessionContext>): SessionContext {
    const existingSession = this.getSession(userId);
    
    // Merge updates into existing session
    const updatedSession: SessionContext = {
      ...existingSession,
      ...updates,
      userId, // Always preserve userId
      timestamp: Date.now() // Always update timestamp
    };
    
    this.sessions.set(userId, updatedSession);
    return updatedSession;
  }

  /**
   * Clear/delete session for a user
   */
  clearSession(userId: string): void {
    this.sessions.delete(userId);
  }

  /**
   * Get all active sessions (for debugging)
   */
  getAllSessions(): Map<string, SessionContext> {
    return new Map(this.sessions);
  }

  /**
   * Get session count (for debugging)
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}

// 🧪 Sample test function for quick local testing
export function testSessionManager() {
  const sm = new SessionManager();
  
  console.log('🧪 SessionManager Test Results:');
  console.log('================================');
  
  // Test 1: Get new session
  console.log('\n1. Creating new session for user "u1":');
  const session1 = sm.getSession('u1');
  console.log('   Result:', JSON.stringify(session1, null, 2));
  
  // Test 2: Update session with category
  console.log('\n2. Updating session with lastCategory:');
  sm.updateSession('u1', { lastCategory: 'kemishe' });
  const session2 = sm.getSession('u1');
  console.log('   Result:', JSON.stringify(session2, null, 2));
  
  // Test 3: Update session with filters
  console.log('\n3. Updating session with appliedFilters:');
  sm.updateSession('u1', { 
    appliedFilters: { 
      price: { max: 20 },
      color: 'black'
    } 
  });
  const session3 = sm.getSession('u1');
  console.log('   Result:', JSON.stringify(session3, null, 2));
  
  // Test 4: Update session with products
  console.log('\n4. Updating session with lastProducts:');
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'KËMISHË',
      price: 23,
      color: 'BLACK',
      size: '42',
      material: 'Cotton',
      _source: 'trieve'
    }
  ];
  sm.updateSession('u1', { lastProducts: mockProducts });
  const session4 = sm.getSession('u1');
  console.log('   Result:', JSON.stringify(session4, null, 2));
  
  // Test 5: Add message to history
  console.log('\n5. Adding message to history:');
  const currentHistory = session4.messageHistory;
  sm.updateSession('u1', { 
    messageHistory: [...currentHistory, 'dua kemishe te zeze nen 20$'] 
  });
  const session5 = sm.getSession('u1');
  console.log('   Result:', JSON.stringify(session5, null, 2));
  
  // Test 6: Clear session
  console.log('\n6. Clearing session:');
  sm.clearSession('u1');
  const session6 = sm.getSession('u1');
  console.log('   Result (should be fresh):', JSON.stringify(session6, null, 2));
  
  // Test 7: Multiple users
  console.log('\n7. Testing multiple users:');
  sm.updateSession('u2', { lastCategory: 'pantofla' });
  sm.updateSession('u3', { lastCategory: 'atlete' });
  console.log('   Session count:', sm.getSessionCount());
  console.log('   u2 session:', JSON.stringify(sm.getSession('u2'), null, 2));
  console.log('   u3 session:', JSON.stringify(sm.getSession('u3'), null, 2));
}
