import React, { useState, useEffect, useCallback } from 'react';
import { Download, FileText, X, Settings, History, Save, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { exportToExcel } from '../utils/excelExport';
import { exportToCSV, ExportConfiguration, DEFAULT_FIELD_CONFIGS, ConfigurationManager } from '../utils/csvExport';
import CSVExportConfig from './CSVExportConfig';
import { showSuccess, showError, showInfo } from '../utils/toast';
import { useAppStore } from '../store';

const BOQExport = ({ isOpen, onClose, boqItems }) => {
  const { setLoading } = useAppStore();
  const [projectName, setProjectName] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('excel');
  const [showCSVConfig, setShowCSVConfig] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  const [exportTemplates, setExportTemplates] = useState([]);
  const [configManager] = useState(() => new ConfigurationManager());

  const totalValue = boqItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const projectInfo = {
    name: projectName || 'Untitled Project',
    description: projectDescription,
    client: clientName,
    location: projectLocation,
    notes: projectNotes,
    company: 'BOQ Builder'
  };

  const exportFormats = [
    { id: 'excel', name: 'Excel (.xlsx)', icon: FileText, description: 'Multi-sheet workbook with formatting' },
    { id: 'csv', name: 'CSV (.csv)', icon: FileText, description: 'Comma-separated values file' },
    { id: 'pdf', name: 'PDF (.pdf)', icon: Download, description: 'Formatted PDF document' }
  ];

  // Load export history and templates on mount
  useEffect(() => {
    loadExportHistory();
    loadExportTemplates();
  }, []);

  const loadExportHistory = useCallback(() => {
    try {
      const history = JSON.parse(localStorage.getItem('boq_export_history') || '[]');
      setExportHistory(history.slice(0, 10)); // Keep last 10 exports
    } catch (error) {
      console.error('Error loading export history:', error);
      setExportHistory([]);
    }
  }, []);

  const loadExportTemplates = useCallback(() => {
    const templates = configManager.loadConfigurations();
    const defaultTemplates = configManager.getDefaultConfigurations();
    setExportTemplates([...defaultTemplates, ...templates]);
  }, [configManager]);

  const saveToHistory = useCallback((exportData) => {
    try {
      const historyItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        projectName: exportData.projectName,
        format: exportData.format,
        fileName: exportData.fileName,
        itemCount: exportData.itemCount,
        totalValue: exportData.totalValue
      };

      const currentHistory = JSON.parse(localStorage.getItem('boq_export_history') || '[]');
      const updatedHistory = [historyItem, ...currentHistory].slice(0, 10);
      localStorage.setItem('boq_export_history', JSON.stringify(updatedHistory));
      setExportHistory(updatedHistory);
    } catch (error) {
      console.error('Error saving to export history:', error);
    }
  }, []);

  const simulateProgress = useCallback((duration = 2000) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setExportProgress(100);
          setTimeout(resolve, 200);
        } else {
          setExportProgress(Math.min(progress, 95));
        }
      }, duration / 20);
    });
  }, []);

  const handleExcelExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Preparing Excel export...');
    setLoading('export', true);
    
    try {
      // Simulate progress for user feedback
      await simulateProgress(1500);
      setExportStatus('Generating worksheets...');
      
      const result = exportToExcel(boqItems, projectInfo);
      
      if (result.success) {
        setExportStatus('Export completed successfully!');
        showSuccess(`Excel export completed successfully! File: ${result.fileName}`);
        
        // Save to history
        saveToHistory({
          projectName: projectInfo.name,
          format: 'Excel',
          fileName: result.fileName,
          itemCount: boqItems.length,
          totalValue: totalValue
        });
        
        setTimeout(() => onClose(), 1000);
      } else {
        setExportStatus('Export failed');
        showError(`Export failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Excel export error:', error);
      setExportStatus('Export failed');
      showError('Failed to export Excel file. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportStatus('');
      setLoading('export', false);
    }
  };

  const handleQuickCSVExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Preparing CSV export...');
    setLoading('export', true);
    
    try {
      // Simulate progress for user feedback
      await simulateProgress(1000);
      setExportStatus('Generating CSV data...');
      
      // Use basic configuration for quick export
      const config = new ExportConfiguration(DEFAULT_FIELD_CONFIGS.basic);
      const result = exportToCSV(boqItems, projectInfo, config);
      
      if (result.success) {
        setExportStatus('Export completed successfully!');
        showSuccess(`CSV export completed successfully! File: ${result.fileName}`);
        
        // Save to history
        saveToHistory({
          projectName: projectInfo.name,
          format: 'CSV',
          fileName: result.fileName,
          itemCount: boqItems.length,
          totalValue: totalValue
        });
        
        setTimeout(() => onClose(), 1000);
      } else {
        setExportStatus('Export failed');
        showError(`Export failed: ${result.message}`);
      }
    } catch (error) {
      console.error('CSV export error:', error);
      setExportStatus('Export failed');
      showError('Failed to export CSV file. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportStatus('');
      setLoading('export', false);
    }
  };

  const handlePDFExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Preparing PDF export...');
    setLoading('export', true);
    
    try {
      // Simulate progress for user feedback
      await simulateProgress(1200);
      setExportStatus('Generating PDF document...');
      
      const doc = new jsPDF('landscape'); // Use landscape for wider table
      
      // Header
      doc.setFontSize(18);
      doc.text('Bill of Quantities', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Project: ${projectName}`, 20, 35);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);
      
      // Table
      const tableData = boqItems.map(item => [
        item.isDependency ? `  └─ ${item.name}` : item.name,
        item.category,
        item.manufacturer || 'N/A',
        item.quantity.toString(),
        item.unit,
        `${(Number(item.unitPrice) || 0).toFixed(2)}`,
        `${(item.quantity * (Number(item.unitPrice) || 0)).toFixed(2)}`
      ]);
      
      doc.autoTable({
        head: [['Item', 'Category', 'Manufacturer', 'Qty', 'Unit', 'Unit Price', 'Total']],
        body: tableData,
        startY: 55,
        foot: [['', '', '', '', '', 'Total Value:', `${totalValue.toFixed(2)}`]],
        footStyles: { fontStyle: 'bold' }
      });
      
      // Notes
      if (projectNotes) {
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.text('Notes:', 20, finalY);
        doc.text(projectNotes, 20, finalY + 10);
      }
      
      const fileName = `${projectName || 'BOQ'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      setExportStatus('Export completed successfully!');
      showSuccess(`PDF export completed successfully! File: ${fileName}`);
      
      // Save to history
      saveToHistory({
        projectName: projectInfo.name,
        format: 'PDF',
        fileName: fileName,
        itemCount: boqItems.length,
        totalValue: totalValue
      });
      
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      console.error('PDF export error:', error);
      setExportStatus('Export failed');
      showError('Failed to export PDF file. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportStatus('');
      setLoading('export', false);
    }
  };

  const handleFormatExport = async () => {
    switch (selectedFormat) {
      case 'excel':
        await handleExcelExport();
        break;
      case 'csv':
        await handleQuickCSVExport();
        break;
      case 'pdf':
        await handlePDFExport();
        break;
      default:
        showError('Please select a valid export format');
    }
  };

  const applyTemplate = (template) => {
    if (template.id.startsWith('default_')) {
      // Apply default template settings
      setSelectedFormat('csv');
      showInfo(`Applied template: ${template.name}`);
    } else {
      // Apply custom template
      setSelectedFormat('csv');
      showInfo(`Applied custom template: ${template.name}`);
    }
    setShowTemplates(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Export BOQ</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
              title="Export History"
            >
              <History size={20} />
            </button>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
              title="Export Templates"
            >
              <Save size={20} />
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Export Format Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Export Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exportFormats.map((format) => {
              const IconComponent = format.icon;
              return (
                <div
                  key={format.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFormat(format.id)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <IconComponent size={20} className={selectedFormat === format.id ? 'text-blue-600' : 'text-gray-600'} />
                    <span className={`font-medium ${selectedFormat === format.id ? 'text-blue-600' : 'text-gray-900'}`}>
                      {format.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{format.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Indicator */}
        {isExporting && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={20} className="text-blue-600" />
              <span className="font-medium text-blue-900">Exporting...</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-700">{exportStatus}</p>
          </div>
        )}

        {/* Export History Panel */}
        {showHistory && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <History size={18} />
              Recent Exports
            </h3>
            {exportHistory.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {exportHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.projectName}</div>
                      <div className="text-xs text-gray-500">
                        {item.format} • {item.itemCount} items • ${item.totalValue.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No export history available</p>
            )}
          </div>
        )}

        {/* Export Templates Panel */}
        {showTemplates && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Save size={18} />
              Export Templates
            </h3>
            {exportTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {exportTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="p-2 bg-white rounded border text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-500">{template.description}</div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No templates available</p>
            )}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Client Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={projectLocation}
                onChange={(e) => setProjectLocation(e.target.value)}
                placeholder="Enter project location"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Project Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg h-20"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Brief description of the project"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Additional Notes</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg h-24"
              value={projectNotes}
              onChange={(e) => setProjectNotes(e.target.value)}
              placeholder="Add any additional notes or specifications"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-2">BOQ Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium">Total Items:</p>
              <p>{boqItems.length}</p>
            </div>
            <div>
              <p className="font-medium">Main Items:</p>
              <p>{boqItems.filter(item => !item.isDependency).length}</p>
            </div>
            <div>
              <p className="font-medium">Dependencies:</p>
              <p>{boqItems.filter(item => item.isDependency).length}</p>
            </div>
            <div>
              <p className="font-medium">Total Value:</p>
              <p className="text-lg font-bold text-green-600">${totalValue.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <p>Excel export includes: BOQ Summary, Detailed Items, and Category Summary worksheets</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-4">
            <button
              onClick={handleFormatExport}
              disabled={isExporting || !projectName.trim()}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <Clock size={20} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Export as {exportFormats.find(f => f.id === selectedFormat)?.name}
                </>
              )}
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowCSVConfig(true)}
              disabled={isExporting || !projectName.trim()}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Settings size={20} />
              Custom CSV Export
            </button>
          </div>
        </div>
      </div>

      {/* CSV Export Configuration Modal */}
      <CSVExportConfig
        isOpen={showCSVConfig}
        onClose={() => setShowCSVConfig(false)}
        boqItems={boqItems}
        projectInfo={projectInfo}
      />
    </div>
  );
};

export default BOQExport;