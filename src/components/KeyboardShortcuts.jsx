import React, { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

const KeyboardShortcuts = ({ isOpen, onClose, onAction }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { key: 'Ctrl + K', description: 'Open command palette', action: 'commandPalette' },
        { key: 'Ctrl + N', description: 'New project', action: 'projectManager' },
        { key: 'Ctrl + O', description: 'Open project', action: 'projectManager' },
        { key: 'Ctrl + S', description: 'Save current project', action: 'save' },
        { key: 'Ctrl + E', description: 'Export BOQ', action: 'boqExport' },
      ]
    },
    {
      category: 'Items',
      items: [
        { key: 'Ctrl + I', description: 'Add items to BOQ', action: 'itemSelector' },
        { key: 'Ctrl + D', description: 'Manage database', action: 'itemEditor' },
        { key: 'Ctrl + F', description: 'Search items', action: 'search' },
        { key: 'Delete', description: 'Remove selected items', action: 'delete' },
        { key: 'Ctrl + A', description: 'Select all items', action: 'selectAll' },
      ]
    },
    {
      category: 'View',
      items: [
        { key: 'Ctrl + 1', description: 'Focus BOQ table', action: 'focusTable' },
        { key: 'Ctrl + 2', description: 'Focus sidebar', action: 'focusSidebar' },
        { key: 'Ctrl + B', description: 'Toggle sidebar', action: 'toggleSidebar' },
        { key: 'F11', description: 'Toggle fullscreen', action: 'fullscreen' },
        { key: 'Ctrl + +', description: 'Zoom in', action: 'zoomIn' },
        { key: 'Ctrl + -', description: 'Zoom out', action: 'zoomOut' },
      ]
    },
    {
      category: 'General',
      items: [
        { key: 'Escape', description: 'Close modal/dialog', action: 'escape' },
        { key: 'Ctrl + Z', description: 'Undo last action', action: 'undo' },
        { key: 'Ctrl + Y', description: 'Redo last action', action: 'redo' },
        { key: '?', description: 'Show keyboard shortcuts', action: 'shortcuts' },
      ]
    }
  ];

  // Filter shortcuts based on search term
  const filteredShortcuts = shortcuts.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.key.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Show shortcuts with ?
      if (key === '?' && !ctrl && !shift && !alt) {
        e.preventDefault();
        onAction('shortcuts');
        return;
      }

      // Close with Escape
      if (key === 'escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (!ctrl) return;

      switch (key) {
        case 'k':
          e.preventDefault();
          onAction('commandPalette');
          break;
        case 'n':
          e.preventDefault();
          onAction('projectManager');
          break;
        case 'i':
          e.preventDefault();
          onAction('itemSelector');
          break;
        case 'd':
          e.preventDefault();
          onAction('itemEditor');
          break;
        case 'e':
          e.preventDefault();
          onAction('boqExport');
          break;
        case 's':
          e.preventDefault();
          onAction('save');
          break;
        case 'f':
          e.preventDefault();
          onAction('search');
          break;
        default:
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onAction, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-4xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Keyboard size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Keyboard Shortcuts</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Boost your productivity with these shortcuts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:ring-opacity-50 transition-all duration-200"
            autoFocus
          />
        </div>

        {/* Shortcuts List */}
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {filteredShortcuts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Keyboard size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No shortcuts found</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {filteredShortcuts.map((category) => (
                <div key={category.category}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {category.category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.items.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          onAction(shortcut.action);
                          onClose();
                        }}
                      >
                        <span className="text-sm text-gray-700 flex-1">
                          {shortcut.description}
                        </span>
                        <div className="flex gap-1">
                          {shortcut.key.split(' + ').map((key, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              {keyIndex > 0 && (
                                <span className="text-gray-400 text-xs">+</span>
                              )}
                              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono text-gray-600 shadow-sm">
                                {key}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">?</kbd> anytime to open this dialog</span>
            <span>Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;