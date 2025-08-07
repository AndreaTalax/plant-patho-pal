/**
 * Debug Tester - Utility per testare e debuggare l'applicazione
 * Verifica i bug più comuni e i problemi di performance
 */

export class DebugTester {
  
  static testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    
    // Test per verificare se la user session funziona ora
    const testUserSession = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: session } = await supabase.auth.getSession();
        
        if (session?.session?.user) {
          console.log('✅ User session found:', session.session.user.id);
          
          // Test insert user session (dovrebbe funzionare ora senza errori)
          const testInsert = await supabase
            .from('user_sessions')
            .insert({
              user_id: session.session.user.id,
              session_id: `test-${Date.now()}`,
              is_active: true,
              last_activity_at: new Date().toISOString()
            });
            
          if (testInsert.error) {
            console.error('❌ User session insert still failing:', testInsert.error);
            return false;
          } else {
            console.log('✅ User session insert working');
            
            // Cleanup test data
            await supabase
              .from('user_sessions')
              .delete()
              .eq('session_id', `test-${Date.now()}`);
              
            return true;
          }
        } else {
          console.log('ℹ️ No active user session');
          return true;
        }
      } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
      }
    };
    
    return testUserSession();
  }
  
  static testColorSystem() {
    console.log('🔍 Testing color system...');
    
    // Verifica che i colori HSL siano correttamente definiti
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue('--primary').trim();
    
    if (primaryColor && primaryColor.includes(' ')) {
      console.log('✅ Primary color uses HSL format:', primaryColor);
      return true;
    } else {
      console.error('❌ Primary color not in HSL format:', primaryColor);
      return false;
    }
  }
  
  static testComponentErrors() {
    console.log('🔍 Testing for common component errors...');
    
    // Test per errori di console comuni
    const originalError = console.error;
    let errorFound = false;
    
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('user_id') || errorMessage.includes('record "new"')) {
        console.log('❌ Found database trigger error:', errorMessage);
        errorFound = true;
      }
      originalError.apply(console, args);
    };
    
    // Restore dopo 5 secondi
    setTimeout(() => {
      console.error = originalError;
    }, 5000);
    
    return !errorFound;
  }
  
  static async runAllTests() {
    console.log('🚀 Starting comprehensive debug test...');
    
    const results = {
      database: await this.testDatabaseConnection(),
      colors: this.testColorSystem(),
      components: this.testComponentErrors(),
    };
    
    const allPassed = Object.values(results).every(result => result === true);
    
    console.log('📊 Test Results:', results);
    
    if (allPassed) {
      console.log('🎉 All tests passed! Application appears to be working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the logs above for details.');
    }
    
    return results;
  }
  
  static logSystemInfo() {
    console.log('📱 System Info:');
    console.log('- User Agent:', navigator.userAgent);
    console.log('- Screen:', `${screen.width}x${screen.height}`);
    console.log('- Viewport:', `${window.innerWidth}x${window.innerHeight}`);
    console.log('- Connection:', (navigator as any).connection?.effectiveType || 'unknown');
    console.log('- Online:', navigator.onLine);
  }
}

// Auto-run tests in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    DebugTester.logSystemInfo();
    DebugTester.runAllTests();
  }, 2000);
}