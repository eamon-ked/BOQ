import React from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { masterDatabase } from '../data/masterDatabase';

const DependencyWarnings = ({ boqItems, onAddDependency }) => {
  const getMissingDependencies = () => {
    const missingDeps = [];
    const boqItemIds = boqItems.map(item => item.id);
    
    boqItems.forEach(boqItem => {
      const masterItem = masterDatabase.find(item => item.id === boqItem.id);
      if (masterItem && masterItem.dependencies.length > 0) {
        masterItem.dependencies.forEach(dep => {
          const isInBOQ = boqItemIds.includes(dep.itemId);
          if (!isInBOQ) {
            const depItem = masterDatabase.find(item => item.id === dep.itemId);
            if (depItem) {
              const existingDep = missingDeps.find(md => md.itemId === dep.itemId);
              if (existingDep) {
                existingDep.requiredBy.push({
                  name: boqItem.name,
                  quantity: boqItem.quantity * dep.quantity
                });
                existingDep.totalQuantity += boqItem.quantity * dep.quantity;
              } else {
                missingDeps.push({
                  itemId: dep.itemId,
                  item: depItem,
                  requiredBy: [{
                    name: boqItem.name,
                    quantity: boqItem.quantity * dep.quantity
                  }],
                  totalQuantity: boqItem.quantity * dep.quantity
                });
              }
            }
          }
        });
      }
    });
    
    return missingDeps;
  };

  const missingDependencies = getMissingDependencies();

  if (missingDependencies.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-green-700">Dependencies</h3>
        <div className="text-center py-4 text-green-600">
          <p>✓ All dependencies are satisfied</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-orange-700 flex items-center gap-2">
        <AlertTriangle size={20} />
        Missing Dependencies
      </h3>
      
      <div className="space-y-3">
        {missingDependencies.map(dep => (
          <div key={dep.itemId} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-orange-900">{dep.item.name}</h4>
                <p className="text-sm text-orange-700">
                  Suggested quantity: {dep.totalQuantity} {dep.item.unit}
                </p>
                <p className="text-sm text-orange-600">
                  ${(dep.totalQuantity * (Number(dep.item.unitPrice) || 0)).toFixed(2)} total
                </p>
              </div>
              <button
                onClick={() => onAddDependency({ ...dep.item, quantity: dep.totalQuantity })}
                className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 flex items-center gap-1"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            
            <div className="text-xs text-orange-600">
              Required by: {dep.requiredBy.map(req => `${req.name} (${req.quantity})`).join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DependencyWarnings;