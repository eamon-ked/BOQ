import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorTestComponent = () => {
  const [shouldThrowError, setShouldThrowError] = useState(false);

  if (shouldThrowError) {
    throw new Error('This is a test error to verify ErrorBoundary functionality');
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="text-yellow-600" size={20} />
        <h3 className="font-semibold text-yellow-800">Error Boundary Test</h3>
      </div>
      <p className="text-yellow-700 text-sm mb-3">
        This component can trigger an error to test the ErrorBoundary functionality.
      </p>
      <button
        onClick={() => setShouldThrowError(true)}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
      >
        Trigger Error
      </button>
    </div>
  );
};

export default ErrorTestComponent;