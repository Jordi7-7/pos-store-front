import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Desmonta los componentes renderizados entre tests
afterEach(() => {
  cleanup();
});
