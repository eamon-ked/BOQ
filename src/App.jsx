import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store';
import { masterDatabase, categories } from './data/masterDatabase';
import BOQTable from './components/BOQTable';
import ItemSelector from './components/ItemSelector';
import ItemManager from './components/ItemManager';
import BOQExport from './components/BOQExport';
import CategoryManager from './components/CategoryManager';
import BOQProjectManager from './components/BOQProjectManager';
import ProjectTemplate from './components/ProjectTemplate';
import databaseService from './services/database';

function App() {
    // Get data from store
    const boqItems = useAppStore((state) => state.data.boqItems);
    const storeDatabase = useAppStore((state) => state.data.masterDatabase);
    const storeCategories = useAppStore((state) => state.data.categories);
    const currentProject = useAppStore((state) => state.data.currentProject);
    const modals = useAppStore((state) => state.ui.modals);

    // Actions
    const setMasterDatabase = useAppStore((state) => state.setMasterDatabase);
    const setCategories = useAppStore((state) => state.setCategories);
    const setCurrentProject = useAppStore((state) => state.setCurrentProject);
    const openModal = useAppStore((state) => state.openModal);
    const closeModal = useAppStore((state) => state.closeModal);
    const clearBOQ = useAppStore((state) => state.clearBOQ);
    const clearError = useAppStore((state) => state.clearError);
    const setError = useAppStore((state) => state.setError);

    // Initialize data on app load
    useEffect(() => {
        if (storeDatabase.length === 0) {
            setMasterDatabase(masterDatabase);
            setCategories(categories);
        }
    }, [storeDatabase.length, setMasterDatabase, setCategories]);

    // Category management functions
    const handleAddCategory = async (categoryName) => {
        try {
            await databaseService.addCategory(categoryName);
            const updatedCategories = await databaseService.getCategories();
            setCategories(updatedCategories);
            return true;
        } catch (error) {
            setError('categoryManager', error.message);
            return false;
        }
    };

    const handleUpdateCategory = async (oldName, newName) => {
        try {
            await databaseService.updateCategory(oldName, newName);
            const updatedCategories = await databaseService.getCategories();
            setCategories(updatedCategories);
            return true;
        } catch (error) {
            setError('categoryManager', error.message);
            return false;
        }
    };

    const handleDeleteCategory = async (categoryName) => {
        try {
            await databaseService.deleteCategory(categoryName);
            const updatedCategories = await databaseService.getCategories();
            setCategories(updatedCategories);
            return true;
        } catch (error) {
            setError('categoryManager', error.message);
            return false;
        }
    };

    // Project management functions
    const handleLoadBOQ = (items, project) => {
        clearBOQ();
        items.forEach(item => {
            useAppStore.getState().addBOQItem(item, item.quantity);
        });
        setCurrentProject(project);
    };

    const handleSaveBOQ = (projectId, projectName) => {
        setCurrentProject({ id: projectId, name: projectName });
    };

    // Wrapper functions for BOQProjectManager
    const getBOQProjects = async () => {
        return await databaseService.getBOQProjects();
    };

    const createBOQProject = async (name, description) => {
        const result = await databaseService.createBOQProject(name, description);
        return result.projectId;
    };

    const updateBOQProject = async (projectId, name, description) => {
        return await databaseService.updateBOQProject(projectId, name, description);
    };

    const deleteBOQProject = async (projectId) => {
        return await databaseService.deleteBOQProject(projectId);
    };

    const getBOQItems = async (projectId) => {
        return await databaseService.getBOQItems(projectId);
    };

    const saveBOQItems = async (projectId, items) => {
        return await databaseService.saveBOQItems(projectId, items);
    };

    // Template management functions
    const getProjectTemplates = async (category = null) => {
        return await databaseService.getProjectTemplates(category);
    };

    const createProjectTemplate = async (templateData) => {
        return await databaseService.createProjectTemplate(templateData);
    };

    const updateProjectTemplate = async (templateId, templateData) => {
        return await databaseService.updateProjectTemplate(templateId, templateData);
    };

    const deleteProjectTemplate = async (templateId) => {
        return await databaseService.deleteProjectTemplate(templateId);
    };

    const cloneBOQProject = async (sourceProjectId, newProjectData) => {
        return await databaseService.cloneBOQProject(sourceProjectId, newProjectData);
    };

    const handleApplyTemplate = async (projectId, template) => {
        // Load the template project items
        const templateItems = await getBOQItems(projectId);
        
        // Clear current BOQ and load template items
        clearBOQ();
        templateItems.forEach(item => {
            useAppStore.getState().addBOQItem(item, item.quantity);
        });
        
        // Set current project to the new project created from template
        setCurrentProject({ 
            id: projectId, 
            name: `New Project from ${template.name}` 
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">BOQ Builder</h1>
                        {currentProject.name && (
                            <p className="text-sm text-gray-600 mt-1">
                                Current Project: <span className="font-medium">{currentProject.name}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => openModal('projectManager')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Projects
                        </button>
                        <button
                            onClick={() => openModal('projectTemplate')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Templates
                        </button>
                        <button
                            onClick={() => openModal('categoryManager')}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                            Categories
                        </button>
                        <button
                            onClick={() => openModal('itemSelector')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Add Item
                        </button>
                        <button
                            onClick={() => openModal('itemEditor')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Manage Items
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* BOQ Table - Takes up 2/3 of the space */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <BOQTable />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Items:</span>
                                    <span className="font-semibold">{boqItems.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Quantity:</span>
                                    <span className="font-semibold">
                                        {boqItems.reduce((sum, item) => sum + item.quantity, 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg">
                                    <span className="text-gray-800 font-medium">Total Value:</span>
                                    <span className="font-bold text-green-600">
                                        ${boqItems.reduce((sum, item) => {
                                            const price = item.unitNetPrice || item.unitPrice || 0;
                                            return sum + (price * item.quantity);
                                        }, 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => openModal('projectManager')}
                                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Manage Projects
                                </button>
                                <button
                                    onClick={() => openModal('projectTemplate')}
                                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Project Templates
                                </button>
                                <button
                                    onClick={() => openModal('categoryManager')}
                                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Manage Categories
                                </button>
                                <button
                                    onClick={() => openModal('itemSelector')}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Items to BOQ
                                </button>
                                <button
                                    onClick={() => openModal('itemEditor')}
                                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Manage Database
                                </button>
                                <button
                                    onClick={() => openModal('boqExport')}
                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    disabled={boqItems.length === 0}
                                >
                                    Export BOQ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <ItemSelector />
                <ItemManager />
                <CategoryManager
                    isOpen={modals.categoryManager}
                    onClose={() => closeModal('categoryManager')}
                    categories={storeCategories}
                    onAddCategory={handleAddCategory}
                    onUpdateCategory={handleUpdateCategory}
                    onDeleteCategory={handleDeleteCategory}
                    error={useAppStore((state) => state.errors.categoryManager)}
                    clearError={() => clearError('categoryManager')}
                />
                <BOQProjectManager
                    isOpen={modals.projectManager}
                    onClose={() => closeModal('projectManager')}
                    currentBOQItems={boqItems}
                    onLoadBOQ={handleLoadBOQ}
                    onSaveBOQ={handleSaveBOQ}
                    getBOQProjects={getBOQProjects}
                    createBOQProject={createBOQProject}
                    updateBOQProject={updateBOQProject}
                    deleteBOQProject={deleteBOQProject}
                    getBOQItems={getBOQItems}
                    saveBOQItems={saveBOQItems}
                    cloneBOQProject={cloneBOQProject}
                />
                <BOQExport
                    isOpen={modals.boqExport}
                    onClose={() => closeModal('boqExport')}
                    boqItems={boqItems}
                />
                <ProjectTemplate
                    isOpen={modals.projectTemplate}
                    onClose={() => closeModal('projectTemplate')}
                    currentBOQItems={boqItems}
                    onApplyTemplate={handleApplyTemplate}
                    getProjectTemplates={getProjectTemplates}
                    createProjectTemplate={createProjectTemplate}
                    updateProjectTemplate={updateProjectTemplate}
                    deleteProjectTemplate={deleteProjectTemplate}
                    cloneBOQProject={cloneBOQProject}
                />

                {/* Toast notifications */}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                        success: {
                            duration: 3000,
                            iconTheme: {
                                primary: '#4ade80',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            duration: 5000,
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
}

export default App;