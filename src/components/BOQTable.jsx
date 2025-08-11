import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Trash2, ArrowRight, Lock, Package, Layers, Plus, MoreHorizontal, Maximize2, Minimize2 } from 'lucide-react';
import { useAppStore } from '../store';

// Memoized table row component for performance optimization
const BOQTableRow = memo(({ 
  item, 
  index, 
  isCompact, 
  rowHeight, 
  textSize, 
  showAdvanced, 
  editingCell, 
  editValue, 
  onCellEdit, 
  onCellSave, 
  onRemoveItem,
  onEditValueChange,
  inputRef 
}) => {
  const calculateExtendedNetPrice = useCallback((item) => {
    const unitNetPrice = item.unitNetPrice || item.unitPrice;
    return item.quantity * unitNetPrice;
  }, []);

  return (
    <tr className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors group">
      <td className={`px-2 ${rowHeight} ${textSize} font-medium text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-700`}>
        {index + 1}
      </td>
      <td className={`px-3 ${rowHeight} ${textSize} font-mono text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-700`}>
        <div className="font-medium">{item.partNumber || 'N/A'}</div>
        {!isCompact && (
          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full inline-block mt-1">
            {item.category}
          </div>
        )}
      </td>
      <td className={`px-3 ${rowHeight} ${textSize} text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-700`}>
        <div className="font-medium">{item.name}</div>
        {!isCompact && item.description && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{item.description}</div>
        )}
      </td>
      <td className={`px-2 ${rowHeight} text-center border-r border-gray-100`}>
        {editingCell === `${item.id}-quantity` ? (
          <input
            ref={inputRef}
            type="number"
            min="1"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onBlur={onCellSave}
            className="w-12 px-1 py-0.5 border border-blue-300 rounded text-center text-xs focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <button
            onClick={() => onCellEdit(item.id, 'quantity', item.quantity)}
            className={`${textSize} font-medium hover:bg-blue-100 px-2 py-1 rounded transition-colors`}
            data-testid={`quantity-button-${item.id}`}
          >
            {item.quantity}
          </button>
        )}
      </td>
      <td className={`px-3 ${rowHeight} ${textSize} text-right text-gray-900 border-r border-gray-100`}>
        ${(Number(item.unitPrice) || 0).toFixed(2)}
      </td>
      <td className={`px-3 ${rowHeight} text-right border-r border-gray-100`}>
        <span className={`font-bold ${isCompact ? 'text-sm' : 'text-base'} text-green-600`}>
          ${calculateExtendedNetPrice(item).toFixed(2)}
        </span>
      </td>
      {showAdvanced && (
        <>
          <td className={`px-2 ${rowHeight} ${textSize} text-gray-700 border-r border-gray-100 truncate`}>
            {item.manufacturer || 'N/A'}
          </td>
          <td className={`px-2 ${rowHeight} text-center border-r border-gray-100`}>
            <span className={`px-1 py-0.5 rounded text-xs font-medium ${
              (item.estimatedLeadTime || 0) <= 7 ? 'bg-green-100 text-green-800' :
              (item.estimatedLeadTime || 0) <= 14 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {item.estimatedLeadTime || 0}d
            </span>
          </td>
          <td className={`px-2 ${rowHeight} text-center border-r border-gray-100`}>
            <span className={`px-1 py-0.5 rounded text-xs font-medium ${
              (item.discount || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {(item.discount || 0).toFixed(0)}%
            </span>
          </td>
        </>
      )}
      <td className={`px-2 ${rowHeight} text-center`}>
        <button
          onClick={() => onRemoveItem(item.id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-all opacity-0 group-hover:opacity-100"
          title="Remove item"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for optimization
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.unitPrice === nextProps.item.unitPrice &&
    prevProps.editingCell === nextProps.editingCell &&
    prevProps.editValue === nextProps.editValue &&
    prevProps.isCompact === nextProps.isCompact &&
    prevProps.showAdvanced === nextProps.showAdvanced
  );
});

BOQTableRow.displayName = 'BOQTableRow';

const BOQTable = memo(() => {
  // Get data from store with proper selectors
  const items = useAppStore((state) => state.data.boqItems);
  const masterDatabase = useAppStore((state) => state.data.masterDatabase);
  
  // Get actions from store
  const updateBOQItemQuantity = useAppStore((state) => state.updateBOQItemQuantity);
  const removeBOQItem = useAppStore((state) => state.removeBOQItem);
  const [density, setDensity] = useState('comfortable'); // 'comfortable' or 'compact'
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  const totalExtendedNetPrice = items.reduce((sum, item) => {
    const unitNetPrice = item.unitNetPrice || item.unitPrice;
    const extendedNetPrice = item.quantity * unitNetPrice;
    return sum + extendedNetPrice;
  }, 0);
  
  const mainItems = items.filter(item => !item.isDependency);
  const dependencies = items.filter(item => item.isDependency);

  const calculateExtendedNetPrice = (item) => {
    const unitNetPrice = item.unitNetPrice || item.unitPrice;
    return item.quantity * unitNetPrice;
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'e':
            e.preventDefault();
            // Export functionality would be handled by parent
            break;
          case 'n':
            e.preventDefault();
            // Add new item functionality would be handled by parent
            break;
        }
      }
      
      if (editingCell && e.key === 'Enter') {
        handleCellSave();
      } else if (editingCell && e.key === 'Escape') {
        setEditingCell(null);
        setEditValue('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingCell]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellEdit = useCallback((itemId, field, currentValue) => {
    setEditingCell(`${itemId}-${field}`);
    setEditValue(currentValue.toString());
  }, []);

  const handleCellSave = useCallback(() => {
    if (editingCell) {
      const [itemId, field] = editingCell.split('-');
      if (field === 'quantity') {
        const newQuantity = parseInt(editValue) || 1;
        updateBOQItemQuantity(itemId, newQuantity);
      }
      // Add more field handlers as needed
    }
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, updateBOQItemQuantity]);

  const handleRemoveItem = useCallback((itemId) => {
    removeBOQItem(itemId);
  }, [removeBOQItem]);

  const handleEditValueChange = useCallback((value) => {
    setEditValue(value);
  }, []);

  const isCompact = density === 'compact';
  const rowHeight = isCompact ? 'py-2' : 'py-4';
  const textSize = isCompact ? 'text-xs' : 'text-sm';
  const headerSize = isCompact ? 'text-xs' : 'text-xs';

  return (
    <>
      {/* Compact Header with Controls */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Package className="text-white" size={16} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">BOQ</h2>
              {items.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <span>{mainItems.length} items</span>
                  <span>•</span>
                  <span>{dependencies.length} deps</span>
                  <span>•</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">${totalExtendedNetPrice.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Density Toggle */}
            <button
              onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-white/80 hover:bg-white border border-gray-200 rounded-md transition-colors"
              title={`Switch to ${density === 'compact' ? 'comfortable' : 'compact'} view`}
            >
              {density === 'compact' ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              <span className="hidden sm:inline">{density === 'compact' ? 'Expand' : 'Compact'}</span>
            </button>
            
            {/* Advanced Fields Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-white/80 hover:bg-white border border-gray-200 rounded-md transition-colors"
              title="Toggle advanced fields"
            >
              <MoreHorizontal size={12} />
              <span className="hidden sm:inline">Advanced</span>
            </button>
          </div>
        </div>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-gray-700 dark:text-gray-300">BOQ Empty</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add items to get started</p>
          <div className="flex items-center justify-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span>Click database items or use Add Item</span>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Compact BOQ Table */}
          <table className="w-full min-w-[900px]">
            {/* Sticky Table Header */}
            <thead className={`bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 ${isCompact ? 'text-xs' : 'text-xs'}`}>
              <tr>
                <th className={`px-2 ${isCompact ? 'py-2' : 'py-3'} text-left font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 w-12`}>
                  #
                </th>
                <th className={`px-3 ${isCompact ? 'py-2' : 'py-3'} text-left font-semibold text-gray-700 border-r border-gray-200`}>
                  Part Number
                </th>
                <th className={`px-3 ${isCompact ? 'py-2' : 'py-3'} text-left font-semibold text-gray-700 border-r border-gray-200`}>
                  Description
                </th>
                <th className={`px-2 ${isCompact ? 'py-2' : 'py-3'} text-center font-semibold text-gray-700 border-r border-gray-200 w-16`}>
                  Qty
                </th>
                <th className={`px-3 ${isCompact ? 'py-2' : 'py-3'} text-right font-semibold text-gray-700 border-r border-gray-200 w-24`}>
                  Unit Price
                </th>
                <th className={`px-3 ${isCompact ? 'py-2' : 'py-3'} text-right font-semibold text-gray-700 border-r border-gray-200 w-28`}>
                  Total
                </th>
                {showAdvanced && (
                  <>
                    <th className={`px-2 ${isCompact ? 'py-2' : 'py-3'} text-left font-semibold text-gray-700 border-r border-gray-200 w-20`}>
                      Mfg
                    </th>
                    <th className={`px-2 ${isCompact ? 'py-2' : 'py-3'} text-center font-semibold text-gray-700 border-r border-gray-200 w-16`}>
                      Lead
                    </th>
                    <th className={`px-2 ${isCompact ? 'py-2' : 'py-3'} text-center font-semibold text-gray-700 border-r border-gray-200 w-16`}>
                      Disc%
                    </th>
                  </>
                )}
                <th className={`px-2 ${isCompact ? 'py-2' : 'py-3'} text-center font-semibold text-gray-700 w-12`}>
                  
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-100">
              {/* Main Items */}
              {mainItems.map((item, index) => (
                <BOQTableRow
                  key={`main-${item.id}-${index}`}
                  item={item}
                  index={index}
                  isCompact={isCompact}
                  rowHeight={rowHeight}
                  textSize={textSize}
                  showAdvanced={showAdvanced}
                  editingCell={editingCell}
                  editValue={editValue}
                  onCellEdit={handleCellEdit}
                  onCellSave={handleCellSave}
                  onRemoveItem={handleRemoveItem}
                  onEditValueChange={handleEditValueChange}
                  inputRef={inputRef}
                />
              ))}
              
              {/* Dependencies */}
              {dependencies.map((item, index) => (
                <tr key={`dep-${item.id}-${index}`} className="bg-orange-25 hover:bg-orange-50/50 transition-colors group">
                  <td className={`px-2 ${rowHeight} ${textSize} font-medium text-gray-600 border-r border-gray-100`}>
                    <div className="flex items-center gap-1">
                      <ArrowRight size={10} className="text-orange-500" />
                      <span className="text-xs">{mainItems.length + index + 1}</span>
                    </div>
                  </td>
                  <td className={`px-3 ${rowHeight} ${textSize} font-mono text-gray-700 border-r border-gray-100`}>
                    <div className="font-medium">{item.partNumber || 'N/A'}</div>
                    {!isCompact && (
                      <div className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full inline-block mt-1">
                        Dependency
                      </div>
                    )}
                  </td>
                  <td className={`px-3 ${rowHeight} ${textSize} text-gray-700 border-r border-gray-100`}>
                    <div className="font-medium">{item.name}</div>
                    {!isCompact && (
                      <div className="text-xs text-orange-600 mt-1 truncate">
                        Required by: {item.requiredByName}
                      </div>
                    )}
                  </td>
                  <td className={`px-2 ${rowHeight} text-center border-r border-gray-100`}>
                    <div className="flex items-center justify-center gap-1">
                      <span className={`${textSize} font-medium`}>{item.quantity}</span>
                      <Lock size={10} className="text-gray-400" title="Auto-managed" />
                    </div>
                  </td>
                  <td className={`px-3 ${rowHeight} ${textSize} text-right text-gray-700 border-r border-gray-100`}>
                    ${(Number(item.unitPrice) || 0).toFixed(2)}
                  </td>
                  <td className={`px-3 ${rowHeight} text-right border-r border-gray-100`}>
                    <span className={`font-bold ${isCompact ? 'text-sm' : 'text-base'} text-green-600`}>
                      ${calculateExtendedNetPrice(item).toFixed(2)}
                    </span>
                  </td>
                  {showAdvanced && (
                    <>
                      <td className={`px-2 ${rowHeight} ${textSize} text-gray-700 border-r border-gray-100 truncate`}>
                        {item.manufacturer || 'N/A'}
                      </td>
                      <td className={`px-2 ${rowHeight} text-center border-r border-gray-100`}>
                        <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                          (item.estimatedLeadTime || 0) <= 7 ? 'bg-green-100 text-green-800' :
                          (item.estimatedLeadTime || 0) <= 14 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.estimatedLeadTime || 0}d
                        </span>
                      </td>
                      <td className={`px-2 ${rowHeight} text-center border-r border-gray-100`}>
                        <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                          (item.discount || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {(item.discount || 0).toFixed(0)}%
                        </span>
                      </td>
                    </>
                  )}
                  <td className={`px-2 ${rowHeight} text-center`}>
                    <Lock size={12} className="text-gray-400 mx-auto" title="Cannot remove dependency" />
                  </td>
                </tr>
              ))}
              
              {/* Add New Item Row */}
              <tr className="bg-gray-50/50 border-t-2 border-dashed border-gray-300">
                <td colSpan={showAdvanced ? 10 : 7} className="px-3 py-3 text-center">
                  <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mx-auto">
                    <Plus size={16} />
                    <span className="text-sm font-medium">Add Item (Ctrl+N)</span>
                  </button>
                </td>
              </tr>
            </tbody>
            
            {/* Compact Table Footer */}
            <tfoot className="bg-gradient-to-r from-emerald-50 to-green-50 border-t border-emerald-200 sticky bottom-0">
              <tr>
                <td colSpan={showAdvanced ? 6 : 5} className={`px-3 ${isCompact ? 'py-2' : 'py-3'} text-right text-sm font-bold text-gray-700`}>
                  TOTAL:
                </td>
                <td className={`px-3 ${isCompact ? 'py-2' : 'py-3'} text-right`}>
                  <span className={`font-bold text-emerald-700 ${isCompact ? 'text-lg' : 'text-xl'}`}>
                    ${totalExtendedNetPrice.toFixed(2)}
                  </span>
                </td>
                {showAdvanced && <td colSpan="3"></td>}
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      
      {/* Keyboard Shortcuts Help */}
      {items.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>💡 Tips:</span>
            <span>Click quantity to edit</span>
            <span>•</span>
            <span>Ctrl+E to export</span>
            <span>•</span>
            <span>Ctrl+N to add item</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{items.reduce((sum, item) => sum + item.quantity, 0)} total units</span>
          </div>
        </div>
      )}
    </>
  );
});

BOQTable.displayName = 'BOQTable';

export default BOQTable;