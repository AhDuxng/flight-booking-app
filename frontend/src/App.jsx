import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import AppProviders from './app/providers.jsx';
import router from './app/router.jsx';

export const App = () => {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <Toaster position="top-center" theme="dark" closeButton richColors />
    </AppProviders>
  );
};

export default App;
