
/**
 * Navigation utility functions for the application
 */
export class NavigationUtils {
  /**
   * Redirects to the chat tab
   */
  static redirectToChat(): void {
    console.log('🔄 Redirecting to chat tab...');
    
    // Get current URL
    const currentUrl = new URL(window.location.href);
    
    // Set the tab parameter to 'chat'
    currentUrl.searchParams.set('tab', 'chat');
    
    // Navigate to the new URL
    window.location.href = currentUrl.toString();
  }

  /**
   * Redirects to a specific tab
   */
  static redirectToTab(tab: 'diagnose' | 'chat' | 'library' | 'shop' | 'profile'): void {
    console.log(`🔄 Redirecting to ${tab} tab...`);
    
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('tab', tab);
    window.location.href = currentUrl.toString();
  }

  /**
   * Refreshes the current page
   */
  static refreshPage(): void {
    window.location.reload();
  }
}
