const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ErrorLog {
  id?: number;
  error_message: string;
  error_stack?: string;
  error_type: 'api' | 'parsing' | 'validation' | 'unknown';
  context?: Record<string, unknown>;
  created_at?: string;
  user_agent?: string;
  url?: string;
}

export async function logError(error: Error | string, type: ErrorLog['error_type'] = 'unknown', context?: Record<string, unknown>): Promise<void> {
  const errorLog: Omit<ErrorLog, 'id' | 'created_at'> = {
    error_message: error instanceof Error ? error.message : error,
    error_stack: error instanceof Error ? error.stack : undefined,
    error_type: type,
    context,
    user_agent: navigator.userAgent,
    url: window.location.href,
  };

  try {
    const response = await fetch(`${API_URL}/api/errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorLog),
    });

    if (!response.ok) {
      console.error('Failed to log error to database');
    }
  } catch (e) {
    console.error('Failed to log error:', e);
  }
}

export async function getErrorLogs(filter: ErrorLog['error_type'] | 'all' = 'all'): Promise<ErrorLog[]> {
  try {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('type', filter);

    const response = await fetch(`${API_URL}/api/errors?${params}`);
    if (!response.ok) throw new Error('Failed to fetch logs');

    return await response.json();
  } catch (e) {
    console.error('Failed to fetch logs:', e);
    return [];
  }
}

export async function clearErrorLogs(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/errors`, { method: 'DELETE' });
    return response.ok;
  } catch (e) {
    console.error('Failed to clear logs:', e);
    return false;
  }
}

export async function analyzeCareerMatch(jobDescription: string, resume: string) {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription, resume }),
  });

  if (!response.ok) {
    throw new Error('Analysis failed. Please try again.');
  }

  return response.json();
}
