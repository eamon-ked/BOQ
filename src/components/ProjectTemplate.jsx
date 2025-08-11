import React, { useState, useEffect } from 'react';
import { 
  Save, 
  FolderOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Search, 
  Filter,
  Copy,
  Star,
  Package,
  DollarSign,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useValidatedForm } from '../hooks/useValidatedForm';
import { templateFormSchema } from '../validation/schemas';

// Field Error Display Component
const FieldError = ({ error, warning, touched }) => {
  if (!touched) return null;
  
  if (error) {
    return (
      <div className="flex items-center gap-1 mt-1 text-red-600">
        <AlertCircle size={12} />
        <span className="text-xs">{error}</span>
      </div>
    );
  }
  
  if (warning) {
    return (
      <div className="flex items-center gap-1 mt-1 text-yellow-600">
        <AlertCircle size={12} />
        <span className="text-xs">{warning}</span>
      </div>
    );
  }
  
  return null;
};

// Validated Input Component
const ValidatedInput = ({ 
  label, 
  required = false, 
  type = 'text', 
  placeholder, 
  fieldProps, 
  fieldState,
  className = '',
  autoFocus = false,
  options = [], // For select inputs
  ...props 
}) => {
  const { error, warning, touched } = fieldState;
  const hasError = touched && error;
  const hasWarning = touched && warning && !error;
  
  const inputClassName = `w-full px-3 py-2 border rounded-lg transition-colors duration-200 ${
    hasError 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
      : hasWarning
      ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
  } focus:ring-2 focus:ring-opacity-50 ${className}`;

  const fieldId = `${fieldProps.name}-field`;
  
  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea 
          id={fieldId}
          name={fieldProps.name}
          value={fieldProps.value}
          onChange={fieldProps.onChange}
          onBlur={fieldProps.onBlur}
          aria-invalid={fieldProps['aria-invalid']}
          aria-describedby={fieldProps['aria-describedby']}
          {...props} 
          className={inputClassName} 
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
      ) : type === 'select' ? (
        <select
          id={fieldId}
          name={fieldProps.name}
          value={fieldProps.value}
          onChange={fieldProps.onChange}
          onBlur={fieldProps.onBlur}
          aria-invalid={fieldProps['aria-invalid']}
          aria-describedby={fieldProps['aria-describedby']}
          {...props}
          className={inputClassName}
          autoFocus={autoFocus}
        >
          <option value="">{placeholder || 'Select an option'}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input 
          id={fieldId}
          name={fieldProps.name}
          value={fieldProps.value}
          onChange={fieldProps.onChange}
          onBlur={fieldProps.onBlur}
          aria-invalid={fieldProps['aria-invalid']}
          aria-describedby={fieldProps['aria-describedby']}
          {...props} 
          type={type} 
          className={inputClassName} 
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
      )}
      <FieldError error={error} warning={warning} touched={touched} />
    </div>
  );
};

// Template Card Component
const TemplateCard = ({ 
  template, 
  onApply, 
  onEdit, 
  onDelete, 
  onClone,
  isApplying = false 
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-800">{template.name}</h4>
            {template.isPublic && (
              <Star size={14} className="text-yellow-500" title="Public template" />
            )}
          </div>
          {template.templateDescription && (
            <p className="text-sm text-gray-600 mb-2">{template.templateDescription}</p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            <div className="flex items-center gap-1">
              <Package size={12} />
              <span>{template.itemCount || 0} items</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign size={12} />
              <span>${(template.templateValue || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formatDate(template.updatedAt)}</span>
            </div>
          </div>

          {template.templateCategory && (
            <div className="flex items-center gap-1 mb-2">
              <Tag size={12} className="text-blue-500" />
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {template.templateCategory}
              </span>
            </div>
          )}

          {template.usageCount > 0 && (
            <div className="text-xs text-gray-500">
              Used {template.usageCount} times
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onApply(template)}
          disabled={isApplying}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isApplying
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isApplying ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Applying...
            </>
          ) : (
            <>
              <Copy size={14} />
              Apply Template
            </>
          )}
        </button>
        <button
          onClick={() => onEdit(template)}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
          title="Edit template"
        >
          <Edit3 size={14} />
        </button>
        <button
          onClick={() => onClone(template)}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
          title="Clone template"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={() => onDelete(template)}
          className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
          title="Delete template"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const ProjectTemplate = ({ 
  isOpen, 
  onClose,
  currentBOQItems = [],
  onApplyTemplate,
  // Database functions
  getProjectTemplates,
  createProjectTemplate,
  updateProjectTemplate,
  deleteProjectTemplate,
  cloneBOQProject
}) => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [applyingTemplateId, setApplyingTemplateId] = useState(null);

  // Template categories for the dropdown
  const templateCategories = [
    { value: 'security', label: 'Security Systems' },
    { value: 'networking', label: 'Networking' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'construction', label: 'Construction' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'office', label: 'Office Setup' },
    { value: 'other', label: 'Other' }
  ];

  // Default form values
  const defaultFormValues = {
    name: '',
    templateDescription: '',
    templateCategory: '',
    isPublic: false
  };

  // Initialize validated form
  const {
    values: formData,
    errors: formErrors,
    warnings: formWarnings,
    touched,
    isValid: isFormValid,
    isSubmitting,
    setValue,
    setValues,
    handleSubmit: handleFormSubmit,
    reset: resetForm,
    getFieldProps,
    getFieldState
  } = useValidatedForm({
    schema: templateFormSchema,
    defaultValues: defaultFormValues,
    mode: 'onChange',
    revalidateMode: 'onChange',
    sanitizeOnChange: true,
    sanitizeType: 'template',
    onSubmit: async (validatedData) => {
      return await submitForm(validatedData);
    }
  });

  // Load templates when component opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  // Filter templates when search term or category changes
  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedCategory]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const templateList = await getProjectTemplates();
      setTemplates(templateList);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(
        templateList
          .map(t => t.templateCategory)
          .filter(Boolean)
      )];
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates. Please try again.', {
        duration: 5000,
        icon: '❌',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(term) ||
        (template.templateDescription && template.templateDescription.toLowerCase().includes(term)) ||
        (template.templateCategory && template.templateCategory.toLowerCase().includes(term))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(template => template.templateCategory === selectedCategory);
    }

    setFilteredTemplates(filtered);
  };

  const submitForm = async (validatedData) => {
    try {
      if (editingTemplate) {
        // Update existing template
        await updateProjectTemplate(editingTemplate.id, validatedData);
        toast.success(`Updated template "${validatedData.name}"`, {
          duration: 3000,
          icon: '✏️',
        });
      } else {
        // Create new template from current BOQ
        if (currentBOQItems.length === 0) {
          throw new Error('Cannot create template from empty BOQ. Add some items first.');
        }
        
        const templateData = {
          ...validatedData,
          // Additional template metadata
          estimatedValue: currentBOQItems.reduce((sum, item) => {
            const price = item.customPrice || item.unitPrice;
            return sum + (price * item.quantity);
          }, 0)
        };
        
        await createProjectTemplate(templateData);
        toast.success(`Created template "${validatedData.name}" with ${currentBOQItems.length} items`, {
          duration: 4000,
          icon: '📋',
        });
      }
      
      resetFormState();
      loadTemplates();
      return validatedData;
      
    } catch (error) {
      const errorMessage = `Failed to ${editingTemplate ? 'update' : 'create'} template: ${error.message}`;
      console.error(errorMessage, error);
      toast.error(errorMessage, {
        duration: 5000,
        icon: '❌',
      });
      throw new Error(errorMessage);
    }
  };

  const handleApplyTemplate = async (template) => {
    setApplyingTemplateId(template.id);
    try {
      // Clone the template project to create a new project
      const cloneResult = await cloneBOQProject(template.id, {
        name: `New Project from ${template.name}`,
        status: 'draft',
        isTemplate: false
      });
      
      if (cloneResult.success && onApplyTemplate) {
        await onApplyTemplate(cloneResult.projectId, template);
      }
      
      toast.success(`Applied template "${template.name}"`, {
        duration: 3000,
        icon: '✅',
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to apply template:', error);
      toast.error(`Failed to apply template: ${error.message}`, {
        duration: 5000,
        icon: '❌',
      });
    } finally {
      setApplyingTemplateId(null);
    }
  };

  const handleEditTemplate = (template) => {
    const templateForForm = {
      name: template.name,
      templateDescription: template.templateDescription || '',
      templateCategory: template.templateCategory || '',
      isPublic: template.isPublic || false
    };
    
    setValues(templateForForm, false);
    setEditingTemplate(template);
    setIsCreating(true);
  };

  const handleCloneTemplate = async (template) => {
    try {
      const cloneData = {
        name: `${template.name} (Copy)`,
        templateDescription: template.templateDescription,
        templateCategory: template.templateCategory,
        isPublic: false
      };
      
      const cloneResult = await cloneBOQProject(template.id, cloneData);
      
      if (cloneResult.success) {
        toast.success(`Cloned template "${template.name}"`, {
          duration: 3000,
          icon: '📋',
        });
        loadTemplates();
      }
    } catch (error) {
      console.error('Failed to clone template:', error);
      toast.error(`Failed to clone template: ${error.message}`, {
        duration: 5000,
        icon: '❌',
      });
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!confirm(`Are you sure you want to delete template "${template.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteProjectTemplate(template.id);
      toast.success(`Deleted template "${template.name}"`, {
        duration: 4000,
        icon: '🗑️',
      });
      loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error(`Failed to delete template: ${error.message}`, {
        duration: 5000,
        icon: '❌',
      });
    }
  };

  const resetFormState = () => {
    resetForm(defaultFormValues);
    setIsCreating(false);
    setEditingTemplate(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Project Templates</h2>
              <p className="text-sm text-gray-600 mt-1">Create, manage, and apply reusable project templates</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex h-full max-h-[calc(90vh-80px)]">
          {/* Template List */}
          <div className={`${isCreating ? 'w-2/3' : 'w-full'} flex flex-col`}>
            {/* Search and Filter Bar */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Available Templates</h3>
                  <p className="text-sm text-gray-600">{filteredTemplates.length} of {templates.length} templates</p>
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  disabled={currentBOQItems.length === 0}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    currentBOQItems.length === 0
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                  title={currentBOQItems.length === 0 ? 'Add items to BOQ first' : 'Create new template'}
                >
                  <Plus size={16} />
                  New Template
                </button>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 appearance-none bg-white"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Template Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">
                    {templates.length === 0 ? 'No templates available' : 'No templates match your search'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {templates.length === 0 
                      ? 'Create your first template from a BOQ project'
                      : 'Try adjusting your search criteria'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onApply={handleApplyTemplate}
                      onEdit={handleEditTemplate}
                      onDelete={handleDeleteTemplate}
                      onClone={handleCloneTemplate}
                      isApplying={applyingTemplateId === template.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Create/Edit Form */}
          {isCreating && (
            <div className="w-1/3 border-l border-gray-200 flex flex-col">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
                {!editingTemplate && currentBOQItems.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    From current BOQ with {currentBOQItems.length} items
                  </p>
                )}
              </div>

              <div className="flex-1 p-4">
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <ValidatedInput
                    label="Template Name"
                    required
                    placeholder="Enter template name"
                    autoFocus
                    fieldProps={getFieldProps('name')}
                    fieldState={getFieldState('name')}
                  />

                  <ValidatedInput
                    label="Description"
                    type="textarea"
                    className="h-24"
                    placeholder="Describe what this template is for"
                    fieldProps={getFieldProps('templateDescription')}
                    fieldState={getFieldState('templateDescription')}
                  />

                  <ValidatedInput
                    label="Category"
                    type="select"
                    placeholder="Select a category"
                    options={templateCategories}
                    fieldProps={getFieldProps('templateCategory')}
                    fieldState={getFieldState('templateCategory')}
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic-checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setValue('isPublic', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="isPublic-checkbox" className="text-sm text-gray-700">
                      Make this template public (visible to all users)
                    </label>
                  </div>

                  {!editingTemplate && currentBOQItems.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-purple-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-purple-800 font-medium">Template Preview</p>
                          <p className="text-xs text-purple-700 mt-1">
                            {currentBOQItems.length} items • 
                            ${currentBOQItems.reduce((sum, item) => {
                              const price = item.customPrice || item.unitPrice;
                              return sum + (price * item.quantity);
                            }, 0).toFixed(2)} total value
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={!isFormValid || isSubmitting}
                      className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                        !isFormValid || isSubmitting
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
                    >
                      <Save size={16} />
                      {isSubmitting 
                        ? (editingTemplate ? 'Updating...' : 'Creating...') 
                        : (editingTemplate ? 'Update' : 'Create')
                      } Template
                    </button>
                    <button
                      type="button"
                      onClick={resetFormState}
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Validation Status */}
                  {Object.keys(formErrors).length > 0 && (
                    <div className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{Object.keys(formErrors).length} validation error(s)</span>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectTemplate;