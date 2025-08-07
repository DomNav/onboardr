import { 
  getVectorStore, 
  storeMessage, 
  getConversationHistory, 
  searchContext,
  clearVectorStore 
} from '@/lib/mcp';

describe('MCP Vector Store', () => {
  const testVectorKey = 'test-vector-key-12345';
  const anotherVectorKey = 'test-vector-key-67890';

  beforeEach(async () => {
    // Clear any existing test data
    await clearVectorStore(testVectorKey);
    await clearVectorStore(anotherVectorKey);
  });

  describe('getVectorStore', () => {
    it('should create a new vector store for new vectorKey', async () => {
      const store = await getVectorStore(testVectorKey);
      
      expect(store).toBeDefined();
      expect(store.id).toBe(testVectorKey);
      expect(store.name).toContain('profile_');
    });

    it('should return existing vector store for known vectorKey', async () => {
      const store1 = await getVectorStore(testVectorKey);
      const store2 = await getVectorStore(testVectorKey);
      
      expect(store1.id).toBe(store2.id);
      expect(store1.name).toBe(store2.name);
    });

    it('should throw error for empty vectorKey', async () => {
      await expect(getVectorStore('')).rejects.toThrow('vectorKey is required');
    });

    it('should create separate stores for different vectorKeys', async () => {
      const store1 = await getVectorStore(testVectorKey);
      const store2 = await getVectorStore(anotherVectorKey);
      
      expect(store1.id).not.toBe(store2.id);
      expect(store1.name).not.toBe(store2.name);
    });
  });

  describe('storeMessage', () => {
    it('should store messages in the correct vector store', async () => {
      const store = await getVectorStore(testVectorKey);
      const message = {
        role: 'user' as const,
        content: 'Hello, what is DeFi?',
        timestamp: Date.now()
      };

      await storeMessage(store, message);
      
      const history = await getConversationHistory(store, 10);
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe(message.content);
      expect(history[0].role).toBe('user');
    });

    it('should maintain message order', async () => {
      const store = await getVectorStore(testVectorKey);
      
      const messages = [
        { role: 'user' as const, content: 'First message', timestamp: Date.now() },
        { role: 'assistant' as const, content: 'First response', timestamp: Date.now() + 1 },
        { role: 'user' as const, content: 'Second message', timestamp: Date.now() + 2 }
      ];

      for (const message of messages) {
        await storeMessage(store, message);
      }

      const history = await getConversationHistory(store, 10);
      expect(history).toHaveLength(3);
      expect(history[0].content).toBe('First message');
      expect(history[1].content).toBe('First response');
      expect(history[2].content).toBe('Second message');
    });

    it('should limit stored messages to 50', async () => {
      const store = await getVectorStore(testVectorKey);
      
      // Store 60 messages
      for (let i = 0; i < 60; i++) {
        await storeMessage(store, {
          role: 'user',
          content: `Message ${i}`,
          timestamp: Date.now() + i
        });
      }

      const history = await getConversationHistory(store, 100);
      expect(history).toHaveLength(50);
      expect(history[0].content).toBe('Message 10'); // First 10 should be removed
      expect(history[49].content).toBe('Message 59');
    });

    it('should isolate messages between different vector stores', async () => {
      const store1 = await getVectorStore(testVectorKey);
      const store2 = await getVectorStore(anotherVectorKey);

      await storeMessage(store1, {
        role: 'user',
        content: 'Message for store 1',
        timestamp: Date.now()
      });

      await storeMessage(store2, {
        role: 'user', 
        content: 'Message for store 2',
        timestamp: Date.now()
      });

      const history1 = await getConversationHistory(store1, 10);
      const history2 = await getConversationHistory(store2, 10);

      expect(history1).toHaveLength(1);
      expect(history2).toHaveLength(1);
      expect(history1[0].content).toBe('Message for store 1');
      expect(history2[0].content).toBe('Message for store 2');
    });
  });

  describe('getConversationHistory', () => {
    it('should return empty array for new vector store', async () => {
      const store = await getVectorStore(testVectorKey);
      const history = await getConversationHistory(store, 10);
      
      expect(history).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      const store = await getVectorStore(testVectorKey);
      
      // Store 5 messages
      for (let i = 0; i < 5; i++) {
        await storeMessage(store, {
          role: 'user',
          content: `Message ${i}`,
          timestamp: Date.now() + i
        });
      }

      const history = await getConversationHistory(store, 3);
      expect(history).toHaveLength(3);
      expect(history[0].content).toBe('Message 2'); // Last 3 messages
      expect(history[2].content).toBe('Message 4');
    });

    it('should return all messages if limit exceeds stored count', async () => {
      const store = await getVectorStore(testVectorKey);
      
      await storeMessage(store, {
        role: 'user',
        content: 'Only message',
        timestamp: Date.now()
      });

      const history = await getConversationHistory(store, 10);
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('Only message');
    });
  });

  describe('searchContext', () => {
    beforeEach(async () => {
      const store = await getVectorStore(testVectorKey);
      
      // Store some test messages for searching
      const testMessages = [
        { role: 'user' as const, content: 'What is DeFi?', timestamp: Date.now() },
        { role: 'assistant' as const, content: 'DeFi stands for Decentralized Finance...', timestamp: Date.now() + 1 },
        { role: 'user' as const, content: 'How do I swap tokens on Stellar?', timestamp: Date.now() + 2 },
        { role: 'assistant' as const, content: 'To swap tokens on Stellar, you can use Soroswap...', timestamp: Date.now() + 3 },
        { role: 'user' as const, content: 'What are the risks of yield farming?', timestamp: Date.now() + 4 }
      ];

      for (const message of testMessages) {
        await storeMessage(store, message);
      }
    });

    it('should find messages containing search query', async () => {
      const store = await getVectorStore(testVectorKey);
      const results = await searchContext(store, 'DeFi');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(msg => msg.content.includes('DeFi'))).toBe(true);
    });

    it('should be case insensitive', async () => {
      const store = await getVectorStore(testVectorKey);
      const results = await searchContext(store, 'stellar');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(msg => msg.content.toLowerCase().includes('stellar'))).toBe(true);
    });

    it('should return empty array for non-matching query', async () => {
      const store = await getVectorStore(testVectorKey);
      const results = await searchContext(store, 'nonexistent');
      
      expect(results).toEqual([]);
    });

    it('should limit results to 5 messages', async () => {
      const store = await getVectorStore(testVectorKey);
      
      // Add more messages containing the search term
      for (let i = 0; i < 10; i++) {
        await storeMessage(store, {
          role: 'user',
          content: `Additional message about tokens ${i}`,
          timestamp: Date.now() + 100 + i
        });
      }

      const results = await searchContext(store, 'tokens');
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('clearVectorStore', () => {
    it('should clear all data for specified vectorKey', async () => {
      const store = await getVectorStore(testVectorKey);
      
      await storeMessage(store, {
        role: 'user',
        content: 'Test message',
        timestamp: Date.now()
      });

      let history = await getConversationHistory(store, 10);
      expect(history).toHaveLength(1);

      await clearVectorStore(testVectorKey);

      // Getting store again should create a new one
      const newStore = await getVectorStore(testVectorKey);
      history = await getConversationHistory(newStore, 10);
      expect(history).toHaveLength(0);
    });

    it('should not affect other vector stores', async () => {
      const store1 = await getVectorStore(testVectorKey);
      const store2 = await getVectorStore(anotherVectorKey);

      await storeMessage(store1, {
        role: 'user',
        content: 'Message 1',
        timestamp: Date.now()
      });

      await storeMessage(store2, {
        role: 'user',
        content: 'Message 2', 
        timestamp: Date.now()
      });

      await clearVectorStore(testVectorKey);

      const history1 = await getConversationHistory(store1, 10);
      const history2 = await getConversationHistory(store2, 10);

      expect(history1).toHaveLength(0);
      expect(history2).toHaveLength(1);
      expect(history2[0].content).toBe('Message 2');
    });
  });
});