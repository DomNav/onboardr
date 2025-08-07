// Simple event system for triggering balance refreshes

type BalanceRefreshCallback = () => void;

class BalanceEventEmitter {
  private listeners: BalanceRefreshCallback[] = [];

  addListener(callback: BalanceRefreshCallback) {
    this.listeners.push(callback);
    
    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  emit() {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in balance refresh listener:', error);
      }
    });
  }
}

export const balanceEvents = new BalanceEventEmitter();

// Helper function to trigger balance refresh
export const triggerBalanceRefresh = () => {
  console.log('Triggering balance refresh for all components');
  balanceEvents.emit();
};