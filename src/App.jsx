import React, { useEffect, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Plus, Download, FolderOpen, Layout, Database, Tag, BarChart3, Zap, HelpCircle } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAppStore } from './store';
import { masterDatabase as devMasterDatabase, categories as devCategories } from './data/masterDatabase';

// Use clean database for production builds
const isProduction = import.meta.env.PROD;
const masterDatabase = isProduction ? [] : devMasterDatabase;
const categories = [
  'CCTV', 'Access Control', 'PAVA', 'Cabling', 'Network', 
  'Power', 'Storage', 'Accessories', 'General'
];
import BOQTable from './components/BOQTable';
import ItemSelector from './components/ItemSelector';
import LoadingFallback from './components/LoadingFallback';
import FloatingActionButton from './components/FloatingActionButton';
import NotificationCenter from './components/NotificationCenter';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import ThemeToggle from './components/ThemeToggle';
import { useChunkPreloader } from './hooks/useChunkPreloader';
import databaseService from './services/database';
import performanceMonitor from './utils/performanceMonitor';
import errorTracker from './utils/errorTracking';

// Development-only performance dashboard
const PerformanceDashboard = process.env.NODE_ENV === 'development' 
  ? React.lazy(() => import('./components/PerformanceDashboard'))
  : null;

// Lazy load modal components for better performance
const ItemManager = React.lazy(() => import('./components/ItemManager'));
const BOQExport = React.lazy(() => import('./components/BOQExport'));
const CategoryManager = React.lazy(() => import('./components/CategoryManager'));
const BOQProjectManager = React.lazy(() => import('./components/BOQProjectManager'));
const ProjectTemplate = React.lazy(() => import('./components/ProjectTemplate'));

function AppContent() {
    // Initialize chunk preloader
    useChunkPreloader();

    // Initialize performance monitoring and error tracking
    useEffect(() => {
        // Track app initialization time
        const initTimer = performanceMonitor.startTiming('app-initialization');
        
        // Integrate error tracking with performance monitoring
        errorTracker.integrateWithPerformanceMonitor(performanceMonitor);
        
        // Enable monitoring in development or when explicitly enabled
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Performance monitoring and error tracking enabled');
            
            // Add debugging tools to window
            window.performanceMonitor = performanceMonitor;
            window.errorTracker = errorTracker;
            window.exportPerformanceReport = () => performanceMonitor.exportMetrics();
            window.exportErrorReport = () => errorTracker.exportErrorReport();
            window.showPerformanceDashboard = () => setShowPerformanceDashboard(true);
            
            // Log initialization info
            errorTracker.logInfo('BOQ Builder initialized', {
                version: '1.1.2',
                environment: process.env.NODE_ENV,
                timestamp: new Date().toISOString()
            });
        }
        
        return () => {
            initTimer.end();
        };
    }, []);

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
    
    // Development-only performance dashboard state
    const [showPerformanceDashboard, setShowPerformanceDashboard] = React.useState(false);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = React.useState(false);
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
            <div className="container mx-auto px-4 py-4 md:py-8">
                {/* Enhanced Header with better visual hierarchy */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                                <span className="text-white text-2xl font-bold">BOQ</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">BOQ Builder</h1>
                                {currentProject.name ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Active Project: <span className="font-semibold text-blue-600 dark:text-blue-400">{currentProject.name}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No active project</p>
                                )}
                            </div>
                        </div>
                        
                        {/* Action buttons with improved grouping */}
                        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                            {/* Primary actions */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:mr-4 w-full sm:w-auto">
                                <button
                                    onClick={() => openModal('itemSelector')}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                                >
                                    <Plus size={18} />
                                    Add Items
                                </button>
                                <button
                                    onClick={() => openModal('boqExport')}
                                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    disabled={boqItems.length === 0}
                                >
                                    <Download size={18} />
                                    Export BOQ
                                </button>
                            </div>
                            
                            {/* Secondary actions */}
                            <div className="flex flex-wrap gap-1 items-center justify-center sm:justify-start">
                                <ThemeToggle variant="dropdown" />
                                <button
                                    onClick={() => setShowKeyboardShortcuts(true)}
                                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Keyboard Shortcuts (?)"
                                >
                                    <HelpCircle size={20} />
                                </button>
                                <NotificationCenter />
                                <button
                                    onClick={() => openModal('projectManager')}
                                    className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                                    title="Manage Projects"
                                >
                                    <FolderOpen size={16} />
                                    Projects
                                </button>
                                <button
                                    onClick={() => openModal('projectTemplate')}
                                    className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                                    title="Project Templates"
                                >
                                    <Layout size={16} />
                                    Templates
                                </button>
                                <button
                                    onClick={() => openModal('itemEditor')}
                                    className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                                    title="Manage Database"
                                >
                                    <Database size={16} />
                                    Database
                                </button>
                                <button
                                    onClick={() => openModal('categoryManager')}
                                    className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                                    title="Manage Categories"
                                >
                                    <Tag size={16} />
                                    Categories
                                </button>
                                {process.env.NODE_ENV === 'development' && (
                                    <button
                                        onClick={() => setShowPerformanceDashboard(true)}
                                        className="px-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl hover:bg-yellow-100 hover:border-yellow-300 transition-all duration-200"
                                        title="Performance Dashboard (Dev Only)"
                                    >
                                        📊
                                    </button>
                                )}
                            </div>
                        </div>
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
                        {/* Enhanced Project Summary with visual indicators */}
                        <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg dark:shadow-gray-900/20 p-6 border border-blue-100 dark:border-gray-600 transition-colors duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                    <BarChart3 size={20} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Project Summary</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm dark:shadow-gray-900/20">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        <span className="text-gray-600 dark:text-gray-300">Total Items</span>
                                    </div>
                                    <span className="font-bold text-xl text-gray-800 dark:text-gray-200">{boqItems.length}</span>
                                </div>
                                
                                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm dark:shadow-gray-900/20">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                        <span className="text-gray-600 dark:text-gray-300">Total Quantity</span>
                                    </div>
                                    <span className="font-bold text-xl text-gray-800 dark:text-gray-200">
                                        {boqItems.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">Total Value</span>
                                    </div>
                                    <span className="font-bold text-2xl text-green-600 dark:text-green-400">
                                        ${boqItems.reduce((sum, item) => {
                                            const price = Number(item.unitNetPrice) || Number(item.unitPrice) || 0;
                                            return sum + (price * item.quantity);
                                        }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                
                                {/* Progress indicator */}
                                {boqItems.length > 0 && (
                                    <div className="mt-4 p-3 bg-white rounded-lg shadow-sm">
                                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                                            <span>Project Progress</span>
                                            <span>{Math.min(100, Math.round((boqItems.length / 10) * 100))}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, Math.round((boqItems.length / 10) * 100))}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Enhanced Quick Actions with better visual hierarchy */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                                    <Zap size={20} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Quick Actions</h3>
                            </div>
                            
                            <div className="space-y-3">
                                {/* Primary actions */}
                                <div className="space-y-2 pb-4 border-b border-gray-100">
                                    <button
                                        onClick={() => openModal('itemSelector')}
                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
                                    >
                                        <Plus size={18} />
                                        Add Items to BOQ
                                    </button>
                                    <button
                                        onClick={() => openModal('boqExport')}
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                        disabled={boqItems.length === 0}
                                    >
                                        <Download size={18} />
                                        Export BOQ
                                    </button>
                                </div>
                                
                                {/* Secondary actions */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => openModal('projectManager')}
                                        className="w-full bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-3 shadow-sm hover:shadow-md"
                                    >
                                        <FolderOpen size={18} />
                                        Manage Projects
                                    </button>
                                    <button
                                        onClick={() => openModal('projectTemplate')}
                                        className="w-full bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-3 shadow-sm hover:shadow-md"
                                    >
                                        <Layout size={18} />
                                        Project Templates
                                    </button>
                                    <button
                                        onClick={() => openModal('itemEditor')}
                                        className="w-full bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-3 shadow-sm hover:shadow-md"
                                    >
                                        <Database size={18} />
                                        Manage Database
                                    </button>
                                    <button
                                        onClick={() => openModal('categoryManager')}
                                        className="w-full bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-3 shadow-sm hover:shadow-md"
                                    >
                                        <Tag size={18} />
                                        Manage Categories
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <ItemSelector />
                
                {/* Lazy-loaded modal components with loading fallbacks */}
                <Suspense fallback={<LoadingFallback message="Loading Item Manager..." overlay />}>
                    <ItemManager />
                </Suspense>
                
                <Suspense fallback={<LoadingFallback message="Loading Category Manager..." overlay />}>
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
                </Suspense>
                
                <Suspense fallback={<LoadingFallback message="Loading Project Manager..." overlay />}>
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
                </Suspense>
                
                <Suspense fallback={<LoadingFallback message="Loading Export..." overlay />}>
                    <BOQExport
                        isOpen={modals.boqExport}
                        onClose={() => closeModal('boqExport')}
                        boqItems={boqItems}
                    />
                </Suspense>
                
                <Suspense fallback={<LoadingFallback message="Loading Templates..." overlay />}>
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
                </Suspense>

                {/* Development-only Performance Dashboard */}
                {process.env.NODE_ENV === 'development' && PerformanceDashboard && (
                    <Suspense fallback={<LoadingFallback message="Loading Performance Dashboard..." overlay />}>
                        <PerformanceDashboard
                            isOpen={showPerformanceDashboard}
                            onClose={() => setShowPerformanceDashboard(false)}
                        />
                    </Suspense>
                )}

                {/* Enhanced Toast notifications */}
                <Toaster
                    position="top-right"
                    gutter={8}
                    containerStyle={{
                        top: 20,
                        right: 20,
                    }}
                    toastOptions={{
                        duration: 4000,
                        className: 'dark:!bg-gray-800 dark:!text-gray-100 dark:!border-gray-700',
                        style: {
                            background: 'white',
                            color: '#374151',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            padding: '16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            maxWidth: '400px',
                        },
                        success: {
                            duration: 3000,
                            style: {
                                background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                                border: '1px solid #bbf7d0',
                                color: '#065f46',
                            },
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            duration: 5000,
                            style: {
                                background: 'linear-gradient(135deg, #fef2f2 0%, #fef7f7 100%)',
                                border: '1px solid #fecaca',
                                color: '#991b1b',
                            },
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                        loading: {
                            style: {
                                background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
                                border: '1px solid #bfdbfe',
                                color: '#1e40af',
                            },
                            iconTheme: {
                                primary: '#3b82f6',
                                secondary: '#fff',
                            },
                        },
                    }}
                />

                {/* Floating Action Button for quick access */}
                <FloatingActionButton onAction={openModal} />

                {/* Keyboard Shortcuts Modal */}
                <KeyboardShortcuts
                    isOpen={showKeyboardShortcuts}
                    onClose={() => setShowKeyboardShortcuts(false)}
                    onAction={(action) => {
                        if (action === 'shortcuts') {
                            setShowKeyboardShortcuts(true);
                        } else {
                            openModal(action);
                        }
                    }}
                />
            </div>
        </div>
    );
}

// Main App component with ThemeProvider wrapper
function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}

export default App;