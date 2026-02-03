import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { ErrorLog, getErrorLogs, clearErrorLogs } from '../lib/api';

interface LoggerProps {
  isAdmin?: boolean;
}

export default function Logger({ isAdmin = false }: LoggerProps) {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [filter, setFilter] = useState<ErrorLog['error_type'] | 'all'>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    const data = await getErrorLogs(filter);
    setLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin, filter]);

  const handleClearLogs = async () => {
    if (!confirm('Czy na pewno chcesz usunąć wszystkie logi?')) return;

    const success = await clearErrorLogs();
    if (success) {
      setLogs([]);
    }
  };

  const getTypeColor = (type: ErrorLog['error_type']) => {
    switch (type) {
      case 'api': return 'bg-red-500/20 text-red-400';
      case 'parsing': return 'bg-yellow-500/20 text-yellow-400';
      case 'validation': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeLabel = (type: ErrorLog['error_type']) => {
    switch (type) {
      case 'api': return 'API';
      case 'parsing': return 'Parsing';
      case 'validation': return 'Walidacja';
      default: return 'Nieznany';
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Logi błędów
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ErrorLog['error_type'] | 'all')}
            className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-1.5"
          >
            <option value="all">Wszystkie</option>
            <option value="api">API</option>
            <option value="parsing">Parsing</option>
            <option value="validation">Walidacja</option>
            <option value="unknown">Nieznane</option>
          </select>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Odśwież"
          >
            <RefreshCw className={`w-4 h-4 text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleClearLogs}
            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            title="Wyczyść logi"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          Ładowanie logów...
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Brak logów błędów
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-gray-700/50 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id!)}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`px-2 py-0.5 text-xs rounded ${getTypeColor(log.error_type)}`}>
                    {getTypeLabel(log.error_type)}
                  </span>
                  <span className="text-sm text-gray-200 truncate">
                    {log.error_message}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {new Date(log.created_at!).toLocaleString('pl-PL', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {expandedLog === log.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {expandedLog === log.id && (
                <div className="px-3 pb-3 border-t border-gray-600 pt-3 space-y-2">
                  {log.error_stack && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Stack trace:</p>
                      <pre className="text-xs text-gray-400 bg-gray-800 p-2 rounded overflow-x-auto">
                        {log.error_stack}
                      </pre>
                    </div>
                  )}
                  {log.context && Object.keys(log.context).length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Kontekst:</p>
                      <pre className="text-xs text-gray-400 bg-gray-800 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.url && (
                    <p className="text-xs text-gray-500">
                      URL: <span className="text-gray-400">{log.url}</span>
                    </p>
                  )}
                  {log.user_agent && (
                    <p className="text-xs text-gray-500 truncate">
                      User Agent: <span className="text-gray-400">{log.user_agent}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}