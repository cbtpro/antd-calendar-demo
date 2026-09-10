import React from 'react';
import { createRoot } from 'react-dom/client';
import Demo from './demo';

const container = document.getElementById('container');

if (!container) {
  throw new Error('Missing root container');
}

createRoot(container).render(<Demo />);
  
