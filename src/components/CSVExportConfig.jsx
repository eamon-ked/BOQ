import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Eye, 
  Save, 
  Download, 
  Copy, 
  Trash2, 
  Plus,
  ChevronDown,
  ChevronUp,
  Info,
  X
} from 'lucide-react';
import { 
  ExportConfiguration, 
  ConfigurationManager, 
  DEFAULT_FIELD_CONFIGS,
  AVAILABLE_FIELDS,
  generateCSVPreview,
  exportToCSV
} from '../utils/csvExport';
import { showSuccess, showError, showInfo } from '../utils/toast';

const CSVExportConfig = ({ isOpen, onClose, boqItems, projectInfo }) => {
  const [configManager] = useState(() => new ConfigurationManager());
  const [configurations, setConfigurations] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');

  // Load configurations on mount
  useEffect(() => {
    if (isOpen) {
      loadConfigurations();
    }
  }, [isOpen]);

  const loadConfigurations = () => {
    const saved = configManager.loadConfigurations();
    const defaults = configManager.getDefaultConfigurations();
    setConfigurations([...defaults, ...saved]);
    
    // Select first configuration by default
    if (saved.length > 0) {
      setSelectedConfig(saved[0]);
    } else if (defaults.length > 0) {
      setSelectedConfig(defaults[0]);
    }
  };

  const handleConfigSelect = (config) => {
    setSelectedConfig(config);
    setConfigName(config.name);
    setConfigDescription(config.description);
    setIsEditing(false);
    setShowPreview(false);
  };

  const handleFieldToggle = (fieldKey) => {
    if (!selectedConfig || !isEditing) return;
    
    const updatedConfig = { ...selectedConfig };
    updatedConfig.updateField(fieldKey, { 
      enabled: !selectedConfig.fields.find(f => f.key === fieldKey)?.enabled 
    });
    setSelectedConfig(updatedConfig);
  };

  const handleFieldLabelChange = (fieldKey, newLabel) => {
    if (!selectedConfig || !isEditing) return;
    
    const updatedConfig = { ...selectedConfig };
    updatedConfig.updateField(fieldKey, { label: newLabel });
    setSelectedConfig(updatedConfig);
  };

  const handleOptionsChange = (optionKey, value) => {
    if (!selectedConfig || !isEditing) return;
    
    const updatedConfig = { ...selectedConfig };
    updatedConfig.options[optionKey] = value;
    updatedConfig.updatedAt = new Date();
    setSelectedConfig(updatedConfig);
  };

  const handleSaveConfig = () => {
    if (!selectedConfig) return;
    
    const validation = selectedConfig.validate();
    if (!validation.isValid) {
      showError(`Configuration invalid: ${validation.errors.join(', ')}`);
      return;
    }
    
    // Update name and description
    selectedConfig.name = configName;
    selectedConfig.description = configDescription;
    selectedConfig.updatedAt = new Date();
    
    const result = configManager.saveConfiguration(selectedConfig);
    if (result.success) {
      showSuccess('Configuration saved successfully');
      loadConfigurations();
      setIsEditing(false);
    } else {
      showError(`Failed to save configuration: ${result.error}`);
    }
  };

  const handleCreateNew = () => {
    const newConfig = new ExportConfiguration({
      name: 'New Configuration',
      description: 'Custom export configuration',
      fields: DEFAULT_FIELD_CONFIGS.basic.fields
    });
    
    setSelectedConfig(newConfig);
    setConfigName(newConfig.name);
    setConfigDescription(newConfig.description);
    setIsEditing(true);
  };

  const handleCloneConfig = () => {
    if (!selectedConfig) return;
    
    const clonedConfig = selectedConfig.clone(`${selectedConfig.name} (Copy)`);
    setSelectedConfig(clonedConfig);
    setConfigName(clonedConfig.name);
    setConfigDescription(clonedConfig.description);
    setIsEditing(true);
  };

  const handleDeleteConfig = () => {
    if (!selectedConfig || selectedConfig.id.startsWith('default_')) {
      showError('Cannot delete default configurations');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      const result = configManager.deleteConfiguration(selectedConfig.id);
      if (result.success) {
        showSuccess('Configuration deleted successfully');
        loadConfigurations();
        setSelectedConfig(null);
      } else {
        showError(`Failed to delete configuration: ${result.error}`);
      }
    }
  };

  const handlePreview = () => {
    if (!selectedConfig) return;
    
    try {
      const preview = generateCSVPreview(boqItems, selectedConfig, 5);
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      showError(`Preview failed: ${error.message}`);
    }
  };

  const handleExport = async () => {
    if (!selectedConfig || isExporting) return;
    
    setIsExporting(true);
    
    try {
      const result = exportToCSV(boqItems, projectInfo, selectedConfig);
      
      if (result.success) {
        showSuccess(`CSV exported successfully! File: ${result.fileName}`);
        onClose();
      } else {
        showError(`Export failed: ${result.message}`);
      }
    } catch (error) {
      showError(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">CSV Export Configuration</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Configuration List */}
          <div className="w-1/3 border-r p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Configurations</h3>
              <button
                onClick={handleCreateNew}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus size={16} />
                New
              </button>
            </div>
            
            <div className="space-y-2">
              {configurations.map((config) => (
                <div
                  key={config.id}
                  className={`p-3 rounded border cursor-pointer ${
                    selectedConfig?.id === config.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleConfigSelect(config)}
                >
                  <div className="font-medium text-sm">{config.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{config.description}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {config.getEnabledFields().length} fields enabled
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Details */}
          <div className="flex-1 flex flex-col">
            {selectedConfig ? (
              <>
                {/* Config Info */}
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={configName}
                            onChange={(e) => setConfigName(e.target.value)}
                            className="text-lg font-medium border rounded px-2 py-1 w-full"
                            placeholder="Configuration name"
                          />
                          <textarea
                            value={configDescription}
                            onChange={(e) => setConfigDescription(e.target.value)}
                            className="text-sm text-gray-600 border rounded px-2 py-1 w-full h-16"
                            placeholder="Configuration description"
                          />
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-medium">{selectedConfig.name}</h3>
                          <p className="text-sm text-gray-600">{selectedConfig.description}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSaveConfig}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                          >
                            <Save size={16} />
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                          >
                            <Settings size={16} />
                            Edit
                          </button>
                          <button
                            onClick={handleCloneConfig}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                          >
                            <Copy size={16} />
                            Clone
                          </button>
                          {!selectedConfig.id.startsWith('default_') && (
                            <button
                              onClick={handleDeleteConfig}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center gap-1"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fields Configuration */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Field Selection</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedConfig.fields.map((field) => (
                        <div key={field.key} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={field.enabled}
                              onChange={() => handleFieldToggle(field.key)}
                              disabled={!isEditing}
                              className="rounded"
                            />
                            <div>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => handleFieldLabelChange(field.key, e.target.value)}
                                  className="font-medium border rounded px-2 py-1 text-sm"
                                />
                              ) : (
                                <div className="font-medium text-sm">{field.label}</div>
                              )}
                              <div className="text-xs text-gray-500">
                                {AVAILABLE_FIELDS[field.key]?.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      Advanced Options
                    </button>
                    
                    {showAdvanced && (
                      <div className="mt-3 p-4 bg-gray-50 rounded border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Delimiter</label>
                            <select
                              value={selectedConfig.options.delimiter}
                              onChange={(e) => handleOptionsChange('delimiter', e.target.value)}
                              disabled={!isEditing}
                              className="w-full border rounded px-2 py-1 text-sm"
                            >
                              <option value=",">Comma (,)</option>
                              <option value=";">Semicolon (;)</option>
                              <option value="\t">Tab</option>
                              <option value="|">Pipe (|)</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Sort By</label>
                            <select
                              value={selectedConfig.options.sortBy}
                              onChange={(e) => handleOptionsChange('sortBy', e.target.value)}
                              disabled={!isEditing}
                              className="w-full border rounded px-2 py-1 text-sm"
                            >
                              <option value="name">Name</option>
                              <option value="category">Category</option>
                              <option value="unitPrice">Unit Price</option>
                              <option value="lineTotal">Line Total</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedConfig.options.includeHeaders}
                              onChange={(e) => handleOptionsChange('includeHeaders', e.target.checked)}
                              disabled={!isEditing}
                              className="rounded"
                            />
                            <label className="text-sm">Include Headers</label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedConfig.options.groupByCategory}
                              onChange={(e) => handleOptionsChange('groupByCategory', e.target.checked)}
                              disabled={!isEditing}
                              className="rounded"
                            />
                            <label className="text-sm">Group by Category</label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedConfig.options.includeProjectInfo}
                              onChange={(e) => handleOptionsChange('includeProjectInfo', e.target.checked)}
                              disabled={!isEditing}
                              className="rounded"
                            />
                            <label className="text-sm">Include Project Info</label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedConfig.options.includeSummary}
                              onChange={(e) => handleOptionsChange('includeSummary', e.target.checked)}
                              disabled={!isEditing}
                              className="rounded"
                            />
                            <label className="text-sm">Include Summary</label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview Section */}
                {showPreview && previewData && (
                  <div className="border-t p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Preview ({previewData.previewRows} of {previewData.totalRows} rows)</h4>
                      <button
                        onClick={() => setShowPreview(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border">
                        <thead>
                          <tr className="bg-gray-100">
                            {previewData.headers.map((header, index) => (
                              <th key={index} className="border px-2 py-1 text-left font-medium">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="border px-2 py-1">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {previewData.hasMore && (
                      <div className="text-xs text-gray-500 mt-2">
                        ... and {previewData.totalRows - previewData.previewRows} more rows
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t p-4 flex justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={handlePreview}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Eye size={16} />
                      Preview
                    </button>
                  </div>
                  
                  <button
                    onClick={handleExport}
                    disabled={isExporting || !selectedConfig}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Download size={16} />
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Info size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Select a configuration to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVExportConfig;