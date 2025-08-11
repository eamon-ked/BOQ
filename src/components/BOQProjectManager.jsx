import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Plus, Edit3, Trash2, X, Calendar, DollarSign, Package, AlertCircle, CheckCircle, Copy, User, MapPin, Clock, Star, Archive, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useValidatedForm } from '../hooks/useValidatedForm';
import { enhancedProjectFormSchema } from '../validation/schemas';

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
  ...props 
}) => {
  // Safely extract field state properties
  const error = fieldState?.error || null;
  const warning = fieldState?.warning || null;
  const touched = Boolean(fieldState?.touched);
  
  const hasError = touched && error;
  const hasWarning = touched && warning && !error;
  
  const inputClassName = `w-full px-3 py-2 border rounded-lg transition-colors duration-200 ${
    hasError 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50' 
      : hasWarning
      ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200 bg-yellow-50'
      : touched && !error
      ? 'border-green-300 focus:border-green-500 focus:ring-green-200 bg-green-50'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
  } focus:ring-2 focus:ring-opacity-50 ${className}`;

  // Safely extract field props and ensure values are strings
  const safeFieldProps = {
    name: fieldProps?.name || '',
    value: fieldProps?.value != null ? String(fieldProps.value) : '',
    onChange: fieldProps?.onChange || (() => {}),
    onBlur: fieldProps?.onBlur || (() => {}),
    'aria-invalid': Boolean(hasError),
    'aria-describedby': fieldProps?.['aria-describedby'] || ''
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea 
          {...safeFieldProps}
          {...props} 
          className={inputClassName} 
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
      ) : (
        <input 
          {...safeFieldProps}
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

const BOQProjectManager = ({ 
  isOpen, 
  onClose, 
  currentBOQItems, 
  onLoadBOQ, 
  onSaveBOQ,
  getBOQProjects,
  createBOQProject,
  updateBOQProject,
  deleteBOQProject,
  getBOQItems,
  saveBOQItems,
  cloneBOQProject 
}) => {
  const [projects, setProjects] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [projectStats, setProjectStats] = useState({});
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');

  // Enhanced form values for project metadata
  const defaultFormValues = {
    name: '',
    description: '',
    status: 'draft',
    clientName: '',
    clientContact: '',
    clientEmail: '',
    location: '',
    estimatedValue: '',
    deadline: '',
    priority: '1',
    notes: ''
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
    schema: enhancedProjectFormSchema,
    defaultValues: defaultFormValues,
    mode: 'onChange',
    revalidateMode: 'onChange',
    sanitizeOnChange: true,
    sanitizeType: 'project',
    onSubmit: async (validatedData) => {
      return await submitForm(validatedData);
    }
  });

  // Load projects when component opens
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  // Calculate project statistics
  const calculateProjectStats = (projectList) => {
    const stats = {
      total: projectList.length,
      draft: projectList.filter(p => p.status === 'draft').length,
      active: projectList.filter(p => p.status === 'active').length,
      completed: projectList.filter(p => p.status === 'completed').length,
      archived: projectList.filter(p => p.status === 'archived').length,
      totalValue: projectList.reduce((sum, p) => sum + (p.total_value || 0), 0),
      avgValue: projectList.length > 0 ? projectList.reduce((sum, p) => sum + (p.total_value || 0), 0) / projectList.length : 0,
      overdue: projectList.filter(p => p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed').length
    };
    setProjectStats(stats);
    return stats;
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectList = await getBOQProjects();
      setProjects(projectList);
      calculateProjectStats(projectList);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects. Please try again.', {
        duration: 5000,
        icon: '❌',
      });
    } finally {
      setLoading(false);
    }
  };

  const submitForm = async (validatedData) => {
    try {
      // Prepare enhanced project data
      const projectData = {
        name: validatedData.name,
        description: validatedData.description,
        status: validatedData.status || 'draft',
        clientName: validatedData.clientName || null,
        clientContact: validatedData.clientContact || null,
        clientEmail: validatedData.clientEmail || null,
        location: validatedData.location || null,
        estimatedValue: validatedData.estimatedValue ? parseFloat(validatedData.estimatedValue) : 0,
        deadline: validatedData.deadline || null,
        priority: parseInt(validatedData.priority) || 1,
        notes: validatedData.notes || null
      };

      if (editingProject) {
        // Update existing project
        await updateBOQProject(editingProject.id, projectData);
        toast.success(`Updated project "${validatedData.name}"`, {
          duration: 3000,
          icon: '✏️',
        });
        resetFormState();
        loadProjects();
        return validatedData;
      } else {
        // Create new project
        const result = await createBOQProject(projectData);
        const projectId = result.projectId || result;
        
        if (projectId && currentBOQItems.length > 0) {
          // Save current BOQ items to the new project
          await saveBOQItems(projectId, currentBOQItems);
          toast.success(`Created project "${validatedData.name}" with ${currentBOQItems.length} items`, {
            duration: 4000,
            icon: '📁',
          });
        } else {
          toast.success(`Created project "${validatedData.name}"`, {
            duration: 3000,
            icon: '📁',
          });
        }
        
        resetFormState();
        loadProjects();
        
        if (onSaveBOQ) {
          onSaveBOQ(projectId, validatedData.name);
        }
        
        return { ...validatedData, id: projectId };
      }
    } catch (error) {
      const errorMessage = `Failed to ${editingProject ? 'update' : 'create'} project: ${error.message}`;
      console.error(errorMessage, error);
      toast.error(errorMessage, {
        duration: 5000,
        icon: '❌',
      });
      throw new Error(errorMessage);
    }
  };

  const handleDeleteProject = async (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    setShowDeleteConfirm(project);
  };

  const confirmDeleteProject = async () => {
    if (!showDeleteConfirm) return;

    try {
      // Create backup before deletion
      const projectItems = await getBOQItems(showDeleteConfirm.id);
      const backupData = {
        project: showDeleteConfirm,
        items: projectItems,
        timestamp: new Date().toISOString()
      };

      // Store backup in localStorage for recovery
      const backupKey = `project_backup_${showDeleteConfirm.id}_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));

      // Delete the project
      await deleteBOQProject(showDeleteConfirm.id);
      
      toast.success(
        <div>
          <div>Deleted project "{showDeleteConfirm.name}"</div>
          <div className="text-xs mt-1 opacity-75">Backup saved for recovery</div>
        </div>,
        {
          duration: 6000,
          icon: '🗑️',
        }
      );

      loadProjects();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error(`Failed to delete project: ${error.message}`, {
        duration: 5000,
        icon: '❌',
      });
    }
  };

  const handleLoadProject = async (project) => {
    try {
      const items = await getBOQItems(project.id);
      if (onLoadBOQ) {
        onLoadBOQ(items, project);
      }
      toast.success(`Loaded project "${project.name}" with ${items.length} items`, {
        duration: 3000,
        icon: '📂',
      });
      onClose();
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const handleSaveToProject = async (project) => {
    try {
      await saveBOQItems(project.id, currentBOQItems);
      loadProjects(); // Refresh to show updated totals
      
      if (onSaveBOQ) {
        onSaveBOQ(project.id, project.name);
      }
    } catch (error) {
      console.error('Failed to save to project:', error);
    }
  };

  const handleCloneProject = async (project) => {
    try {
      const cloneName = `${project.name} (Copy)`;
      const cloneData = {
        name: cloneName,
        description: project.description || '',
        status: 'draft',
        clientName: project.client_name || '',
        clientContact: project.client_contact || '',
        clientEmail: project.client_email || '',
        location: project.location || '',
        estimatedValue: project.estimated_value || 0,
        priority: project.priority || 1,
        notes: project.notes ? `Cloned from: ${project.name}\n\n${project.notes}` : `Cloned from: ${project.name}`
      };

      const result = await cloneBOQProject(project.id, cloneData);
      const newProjectId = result.projectId || result;

      toast.success(`Cloned project "${project.name}" as "${cloneName}"`, {
        duration: 4000,
        icon: '📋',
      });

      loadProjects();
    } catch (error) {
      console.error('Failed to clone project:', error);
      toast.error(`Failed to clone project: ${error.message}`, {
        duration: 5000,
        icon: '❌',
      });
    }
  };

  const startEdit = (project) => {
    // Prepare project data for enhanced form - ensure all values are strings
    const projectForForm = {
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'draft',
      clientName: project.client_name || '',
      clientContact: project.client_contact || '',
      clientEmail: project.client_email || '',
      location: project.location || '',
      estimatedValue: project.estimated_value ? String(project.estimated_value) : '',
      deadline: project.deadline || '',
      priority: project.priority ? String(project.priority) : '1',
      notes: project.notes || ''
    };
    
    setValues(projectForForm, false); // Don't validate immediately when loading
    setEditingProject(project);
    setIsCreating(true);
  };

  const resetFormState = () => {
    resetForm(defaultFormValues);
    setIsCreating(false);
    setEditingProject(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      archived: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.draft;
  };

  const getPriorityIcon = (priority) => {
    const priorityNum = parseInt(priority) || 1;
    if (priorityNum >= 3) return <Star className="text-red-500 lucide-star" size={12} />;
    if (priorityNum === 2) return <Star className="text-yellow-500 lucide-star" size={12} />;
    return <Star className="text-gray-400 lucide-star" size={12} />;
  };

  const isOverdue = (deadline, status) => {
    return deadline && new Date(deadline) < new Date() && status !== 'completed';
  };

  const getFilteredAndSortedProjects = () => {
    let filtered = projects;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle different data types
      if (sortBy === 'total_value' || sortBy === 'estimated_value') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (sortBy === 'updated_at' || sortBy === 'created_at' || sortBy === 'deadline') {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">BOQ Project Manager</h2>
              <p className="text-sm text-gray-600 mt-1">Save, load, and manage your BOQ projects</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Project Statistics */}
          {projectStats.total > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Total Projects</div>
                <div className="text-lg font-semibold text-gray-900">{projectStats.total}</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Total Value</div>
                <div className="text-lg font-semibold text-green-600">${projectStats.totalValue.toFixed(2)}</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Active</div>
                <div className="text-lg font-semibold text-blue-600">{projectStats.active}</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Overdue</div>
                <div className="text-lg font-semibold text-red-600">{projectStats.overdue}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex h-full max-h-[calc(90vh-80px)]">
          {/* Project List */}
          <div className="w-2/3 flex flex-col">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Saved Projects</h3>
                  <p className="text-sm text-gray-600">{getFilteredAndSortedProjects().length} of {projects.length} projects</p>
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center gap-2"
                >
                  <Plus size={16} />
                  New Project
                </button>
              </div>

              {/* Filters and Sorting */}
              <div className="flex gap-3 items-center">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="updated_at">Last Updated</option>
                  <option value="name">Name</option>
                  <option value="total_value">Value</option>
                  <option value="deadline">Deadline</option>
                  <option value="priority">Priority</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-sm px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No saved projects</p>
                  <p className="text-sm text-gray-400">Create your first BOQ project to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {getFilteredAndSortedProjects().map(project => (
                    <div key={project.id} className="p-4 hover:bg-gray-50 transition-all duration-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800">{project.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                            {getPriorityIcon(project.priority)}
                            {isOverdue(project.deadline, project.status) && (
                              <span className="text-red-500 text-xs font-medium">OVERDUE</span>
                            )}
                          </div>
                          
                          {project.description && (
                            <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                          )}

                          {/* Client and Location Info */}
                          {(project.client_name || project.location) && (
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                              {project.client_name && (
                                <div className="flex items-center gap-1">
                                  <User size={12} />
                                  <span>{project.client_name}</span>
                                </div>
                              )}
                              {project.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin size={12} />
                                  <span>{project.location}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>Updated: {formatDate(project.updated_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package size={12} />
                              <span>{project.item_count || 0} items</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={12} />
                              <span>${(project.total_value || 0).toFixed(2)}</span>
                            </div>
                            {project.deadline && (
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>Due: {formatDate(project.deadline)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1 ml-4">
                          <button
                            onClick={() => handleLoadProject(project)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200"
                            title="Load project"
                          >
                            <FolderOpen size={16} />
                          </button>
                          {currentBOQItems.length > 0 && (
                            <button
                              onClick={() => handleSaveToProject(project)}
                              className="text-green-500 hover:text-green-700 hover:bg-green-50 p-2 rounded-lg transition-all duration-200"
                              title="Save current BOQ to this project"
                            >
                              <Save size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleCloneProject(project)}
                            className="text-purple-500 hover:text-purple-700 hover:bg-purple-50 p-2 rounded-lg transition-all duration-200"
                            title="Clone project"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => startEdit(project)}
                            className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 p-2 rounded-lg transition-all duration-200"
                            title="Edit project"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                            title="Delete project"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
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
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h3>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Basic Information</h4>
                    
                    <ValidatedInput
                      label="Project Name"
                      required
                      placeholder="Enter project name"
                      autoFocus
                      fieldProps={getFieldProps('name')}
                      fieldState={getFieldState('name')}
                    />

                    <ValidatedInput
                      label="Description"
                      type="textarea"
                      className="h-20"
                      placeholder="Project description (optional)"
                      fieldProps={getFieldProps('description')}
                      fieldState={getFieldState('description')}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                          {...getFieldProps('status')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <select
                          {...getFieldProps('priority')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                          <option value={1}>Low</option>
                          <option value={2}>Medium</option>
                          <option value={3}>High</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Client Information</h4>
                    
                    <ValidatedInput
                      label="Client Name"
                      placeholder="Client or company name"
                      fieldProps={getFieldProps('clientName')}
                      fieldState={getFieldState('clientName')}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <ValidatedInput
                        label="Contact Person"
                        placeholder="Contact person"
                        fieldProps={getFieldProps('clientContact')}
                        fieldState={getFieldState('clientContact')}
                      />

                      <ValidatedInput
                        label="Email"
                        type="email"
                        placeholder="client@example.com"
                        fieldProps={getFieldProps('clientEmail')}
                        fieldState={getFieldState('clientEmail')}
                      />
                    </div>

                    <ValidatedInput
                      label="Location"
                      placeholder="Project location"
                      fieldProps={getFieldProps('location')}
                      fieldState={getFieldState('location')}
                    />
                  </div>

                  {/* Project Details */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Project Details</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <ValidatedInput
                        label="Estimated Value"
                        type="number"
                        placeholder="0.00"
                        fieldProps={getFieldProps('estimatedValue')}
                        fieldState={getFieldState('estimatedValue')}
                      />

                      <ValidatedInput
                        label="Deadline"
                        type="date"
                        fieldProps={getFieldProps('deadline')}
                        fieldState={getFieldState('deadline')}
                      />
                    </div>

                    <ValidatedInput
                      label="Notes"
                      type="textarea"
                      className="h-20"
                      placeholder="Additional notes or comments"
                      fieldProps={getFieldProps('notes')}
                      fieldState={getFieldState('notes')}
                    />
                  </div>

                  {!editingProject && currentBOQItems.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Your current BOQ with {currentBOQItems.length} items will be saved to this project.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      type="submit"
                      disabled={!isFormValid || isSubmitting}
                      className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                        !isFormValid || isSubmitting
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      <Save size={16} />
                      {isSubmitting 
                        ? (editingProject ? 'Updating...' : 'Creating...') 
                        : (editingProject ? 'Update' : 'Create')
                      } Project
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
                  <div className="flex items-center justify-between text-xs">
                    {Object.keys(formErrors).length > 0 ? (
                      <div className="text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{Object.keys(formErrors).length} validation error(s)</span>
                      </div>
                    ) : isFormValid && formData.name?.trim() ? (
                      <div className="text-green-600 flex items-center gap-1">
                        <CheckCircle size={12} />
                        <span>Form is valid</span>
                      </div>
                    ) : (
                      <div className="text-gray-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>Fill required fields</span>
                      </div>
                    )}
                    
                    {/* Form progress indicators */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${formData.name?.trim() ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                        <span className="text-gray-400">Name</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${formData.clientName?.trim() ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                        <span className="text-gray-400">Client</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete <strong>"{showDeleteConfirm.name}"</strong>?
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-800 text-sm">
                    <AlertCircle size={16} />
                    <span>A backup will be created for recovery purposes</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProject}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOQProjectManager;