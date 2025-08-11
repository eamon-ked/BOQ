import React from 'react';
import { Plus, ShoppingCart, Database, FileText, Search } from 'lucide-react';

const EmptyState = ({ 
  type = 'default',
  title,
  description,
  actionLabel,
  onAction,
  illustration
}) => {
  const getEmptyStateConfig = () => {
    switch (type) {
      case 'boq':
        return {
          icon: ShoppingCart,
          title: title || 'Your BOQ is empty',
          description: description || 'Start building your Bill of Quantities by adding items from the database.',
          actionLabel: actionLabel || 'Add Items',
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'database':
        return {
          icon: Database,
          title: title || 'No items in database',
          description: description || 'Create your first item to start building your product database.',
          actionLabel: actionLabel || 'Add Item',
          iconColor: 'text-purple-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      case 'search':
        return {
          icon: Search,
          title: title || 'No results found',
          description: description || 'Try adjusting your search terms or filters.',
          actionLabel: actionLabel || 'Clear Filters',
          iconColor: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
      case 'projects':
        return {
          icon: FileText,
          title: title || 'No projects yet',
          description: description || 'Create your first project to organize your BOQs.',
          actionLabel: actionLabel || 'New Project',
          iconColor: 'text-indigo-500',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200'
        };
      default:
        return {
          icon: Plus,
          title: title || 'Nothing here yet',
          description: description || 'Get started by adding your first item.',
          actionLabel: actionLabel || 'Get Started',
          iconColor: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getEmptyStateConfig();
  const IconComponent = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-fadeIn">
      {/* Illustration or Icon */}
      <div className={`${config.bgColor} dark:bg-gray-800 ${config.borderColor} dark:border-gray-600 border-2 border-dashed rounded-2xl p-8 mb-6`}>
        {illustration || (
          <IconComponent 
            size={64} 
            className={`${config.iconColor} mx-auto`}
            strokeWidth={1.5}
          />
        )}
      </div>

      {/* Content */}
      <div className="max-w-md">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
          {config.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          {config.description}
        </p>

        {/* Action Button */}
        {onAction && (
          <button
            onClick={onAction}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium mx-auto"
          >
            <Plus size={18} />
            {config.actionLabel}
          </button>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full opacity-20 animate-float"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-100 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 -right-8 w-16 h-16 bg-green-100 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  );
};

export default EmptyState;