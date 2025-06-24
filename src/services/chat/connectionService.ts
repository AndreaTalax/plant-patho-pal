
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class ConnectionService {
  private static retryCount = 0;
  private static maxRetries = 3;
  private static isRetrying = false;
  private static activeRequests = new Map<string, Promise<any>>();

  static async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Database operation',
    requestKey?: string
  ): Promise<T | null> {
    // Prevent duplicate requests
    if (requestKey && this.activeRequests.has(requestKey)) {
      console.log(`⏳ Waiting for existing request: ${requestKey}`);
      try {
        return await this.activeRequests.get(requestKey);
      } catch (error) {
        this.activeRequests.delete(requestKey);
        throw error;
      }
    }

    const executeOperation = async (): Promise<T> => {
      try {
        console.log(`🔄 Executing ${operationName}...`);
        const result = await operation();
        
        // Reset retry count on success
        this.retryCount = 0;
        return result;
      } catch (error: any) {
        console.error(`❌ ${operationName} failed:`, error);
        
        // Check if it's a connection/resource error
        if (this.isConnectionError(error)) {
          return await this.handleConnectionError(operation, operationName);
        }
        
        throw error;
      }
    };

    if (requestKey) {
      const promise = executeOperation();
      this.activeRequests.set(requestKey, promise);
      
      try {
        const result = await promise;
        this.activeRequests.delete(requestKey);
        return result;
      } catch (error) {
        this.activeRequests.delete(requestKey);
        throw error;
      }
    }

    return executeOperation();
  }

  private static isConnectionError(error: any): boolean {
    return (
      error?.code === 'PGRST002' ||
      error?.code === '57014' ||
      error?.message?.includes('schema cache') ||
      error?.message?.includes('statement timeout') ||
      error?.message?.includes('Could not query the database') ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('ERR_INSUFFICIENT_RESOURCES') ||
      error?.message?.includes('net::ERR_')
    );
  }

  private static async handleConnectionError<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> {
    if (this.isRetrying || this.retryCount >= this.maxRetries) {
      console.error(`❌ Max retries reached for ${operationName}`);
      toast.error('Persistent connection issues. Please refresh the page.');
      return null;
    }

    this.isRetrying = true;
    this.retryCount++;

    // Exponential backoff with longer delays for resource errors
    const delay = Math.min(2000 * Math.pow(2, this.retryCount), 10000);
    console.log(`⏳ Retry ${this.retryCount}/${this.maxRetries} in ${delay}ms for ${operationName}`);
    
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const result = await operation();
      this.isRetrying = false;
      console.log(`✅ ${operationName} succeeded on retry ${this.retryCount}`);
      return result;
    } catch (retryError) {
      this.isRetrying = false;
      
      if (this.isConnectionError(retryError)) {
        return await this.handleConnectionError(operation, operationName);
      }
      
      throw retryError;
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      return !error;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  static clearActiveRequests(): void {
    this.activeRequests.clear();
    this.retryCount = 0;
    this.isRetrying = false;
  }
}
