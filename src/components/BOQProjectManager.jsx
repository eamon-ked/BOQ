import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Plus, Edit3, Trash2, X, Calendar, DollarSign, Package } from 'lucide-react';

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
  saveBOQItems 
}) => {
  const [projects, setProjects] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  // Load projects when component opens
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectList = await getBOQProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;

    try {
      const projectId = await createBOQProject(projectForm.name, projectForm.description);
      if (projectId && currentBOQItems.length > 0) {
        // Save current BOQ items to the new project
        await saveBOQItems(projectId, currentBOQItems);
      }
      
      resetForm();
      loadProjects();
      
      if (onSaveBOQ) {
        onSaveBOQ(projectId, projectForm.name);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name.trim() || !editingProject) return;

    try {
      await updateBOQProject(editingProject.id, projectForm.name, projectForm.description);
      resetForm();
      loadProjects();
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this BOQ project? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteBOQProject(projectId);
      loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleLoadProject = async (project) => {
    try {
      const items = await getBOQItems(project.id);
      if (onLoadBOQ) {
        onLoadBOQ(items, project);
      }
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

  const startEdit = (project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || ''
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setProjectForm({ name: '', description: '' });
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
        </div>

        <div className="flex h-full max-h-[calc(90vh-80px)]">
          {/* Project List */}
          <div className="w-2/3 flex flex-col">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Saved Projects</h3>
                <p className="text-sm text-gray-600">{projects.length} projects</p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center gap-2"
              >
                <Plus size={16} />
                New Project
              </button>
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
                  {projects.map(project => (
                    <div key={project.id} className="p-4 hover:bg-gray-50 transition-all duration-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-1">{project.name}</h4>
                          {project.description && (
                            <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>Updated: {formatDate(project.updated_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package size={12} />
                              <span>{project.item_count} items</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={12} />
                              <span>${project.total_value.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
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

              <div className="flex-1 p-4">
                <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Project Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter project name"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={projectForm.description}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Project description (optional)"
                    />
                  </div>

                  {!editingProject && currentBOQItems.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Your current BOQ with {currentBOQItems.length} items will be saved to this project.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      {editingProject ? 'Update' : 'Create'} Project
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BOQProjectManager;