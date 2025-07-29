import React, { useState } from 'react';
import { Download, Upload, Database, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';

const DatabaseManager = ({ isOpen, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const { exportDatabase, importDatabase } = useDatabase();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setMessage('');
      
      const data = await exportDatabase();
      if (!data) {
        throw new Error('Failed to export database');
      }

      // Create blob and download
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boq_database_backup_${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage('Database exported successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(`Export failed: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setMessage('');

      const arrayBuffer = await file.arrayBuffer();
      
      const success = await importDatabase(arrayBuffer);
      if (success) {
        setMessage('Database imported successfully! Please refresh the page.');
        setMessageType('success');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('Failed to import database');
      }
    } catch (error) {
      setMessage(`Import failed: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsImporting(false);
      event.target.value = ''; // Reset file input
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Database className="text-white" size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Database Manager</h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Export Section */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Download className="text-green-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">Export Database</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Download a backup of your current database including all items, categories, and dependencies.
              </p>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Export Database
                  </>
                )}
              </button>
            </div>

            {/* Import Section */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Upload className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">Import Database</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Restore from a previously exported database backup. This will replace all current data.
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept=".db"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <button
                  disabled={isImporting}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Choose Database File
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`rounded-lg p-4 flex items-center gap-3 ${
                messageType === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {messageType === 'success' ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <AlertCircle className="text-red-600" size={20} />
                )}
                <p className={`text-sm font-medium ${
                  messageType === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message}
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-yellow-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Important Notes:</p>
                  <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                    <li>• Importing will replace all current data</li>
                    <li>• Export regularly to avoid data loss</li>
                    <li>• Database is stored locally in your browser</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManager;