import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { DebugTester } from '@/utils/debugTester';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'running';
  details?: string;
}

const BugValidator: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'Database Connection', status: 'running' },
    { name: 'Color System', status: 'running' },
    { name: 'Component Errors', status: 'running' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    
    try {
      const results = await DebugTester.runAllTests();
      
      setTestResults([
        {
          name: 'Database Connection',
          status: results.database ? 'passed' : 'failed',
          details: results.database ? 'User sessions working correctly' : 'Database trigger errors detected'
        },
        {
          name: 'Color System',
          status: results.colors ? 'passed' : 'failed',
          details: results.colors ? 'HSL colors properly configured' : 'Color system issues detected'
        },
        {
          name: 'Component Errors',
          status: results.components ? 'passed' : 'failed',
          details: results.components ? 'No component errors found' : 'Component errors detected'
        },
      ]);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-info animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge variant="secondary" className="bg-success text-success-foreground">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="secondary" className="bg-info text-info-foreground">Running</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className={`h-5 w-5 ${isRunning ? 'animate-spin' : ''}`} />
          Bug Validation Tests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {testResults.map((result, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {getStatusIcon(result.status)}
              <div>
                <p className="font-medium">{result.name}</p>
                {result.details && (
                  <p className="text-sm text-muted-foreground">{result.details}</p>
                )}
              </div>
            </div>
            {getStatusBadge(result.status)}
          </div>
        ))}
        
        <div className="pt-4 border-t">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="w-full"
            variant="outline"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-run Tests
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Tests automatically run on app startup in development mode
        </div>
      </CardContent>
    </Card>
  );
};

export default BugValidator;