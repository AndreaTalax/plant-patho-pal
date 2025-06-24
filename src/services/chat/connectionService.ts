
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class ConnectionService {
  private static retryCount = 0;
  private static maxRetries = 3;
  private static isRetrying = false;

  static async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Database operation'
  ): Promise<T | null> {
    try {
      console.log(`🔄 Executing ${operationName}...`);
      const result = await operation();
      
      // Reset retry count on success
      this.retryCount = 0;
      return result;
    } catch (error: any) {
      console.error(`❌ ${operationName} failed:`, error);
      
      // Check if it's a connection/schema cache error
      if (this.isConnectionError(error)) {
        return await this.handleConnectionError(operation, operationName);
      }
      
      throw error;
    }
  }

  private static isConnectionError(error: any): boolean {
    return (
      error?.code === 'PGRST002' ||
      error?.code === '57014' ||
      error?.message?.includes('schema cache') ||
      error?.message?.includes('statement timeout') ||
      error?.message?.includes('Could not query the database')
    );
  }

  private static async handleConnectionError<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> {
    if (this.isRetrying || this.retryCount >= this.maxRetries) {
      console.error(`❌ Max retries reached for ${operationName}`);
      toast.error('Problemi di connessione persistenti. Ricarica la pagina.');
      return null;
    }

    this.isRetrying = true;
    this.retryCount++;

    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 5000);
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
}
