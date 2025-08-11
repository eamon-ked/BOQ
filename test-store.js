import React from 'react';
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

// Minimal test store
const useTestStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

function TestComponent() {
  const { count, increment } = useTestStore(
    (state) => ({
      count: state.count,
      increment: state.increment,
    }),
    shallow
  );

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

export default TestComponent;