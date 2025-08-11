import React, { useState } from 'react';
import { Plus, X, ShoppingCart, Database, FolderOpen, Download } from 'lucide-react';

const FloatingActionButton = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      id: 'addItem',
      icon: ShoppingCart,
      label: 'Add Items',
      color: 'from-blue-500 to-blue-600',
      action: () => onAction('itemSelector')
    },
    {
      id: 'manageDatabase',
      icon: Database,
      label: 'Manage Database',
      color: 'from-purple-500 to-purple-600',
      action: () => onAction('itemEditor')
    },
    {
      id: 'projects',
      icon: FolderOpen,
      label: 'Projects',
      color: 'from-indigo-500 to-indigo-600',
      action: () => onAction('projectManager')
    },
    {
      id: 'export',
      icon: Download,
      label: 'Export BOQ',
      color: 'from-green-500 to-green-600',
      action: () => onAction('boqExport')
    }
  ];

  const handleActionClick = (actionFn) => {
    actionFn();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Action buttons */}
      <div className={`flex flex-col-reverse gap-3 mb-4 transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {actions.map((action, index) => (
          <div
            key={action.id}
            className="flex items-center gap-3 animate-slideIn"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap border border-gray-200 dark:border-gray-700">
              {action.label}
            </span>
            <button
              onClick={() => handleActionClick(action.action)}
              className={`w-12 h-12 bg-gradient-to-r ${action.color} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center transform hover:scale-110`}
            >
              <action.icon size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 ${
          isOpen ? 'rotate-45' : 'rotate-0'
        }`}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 dark:bg-opacity-40 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default FloatingActionButton;