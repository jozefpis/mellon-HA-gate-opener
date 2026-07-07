import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Admin from './pages/Admin.jsx';
import Gate from './pages/Gate.jsx';
import Preview from './pages/Preview.jsx';
import { I18nProvider } from './i18n.jsx';
import './index.css';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/admin" replace /> },
  { path: '/admin', element: <Admin /> },
  { path: '/g/:token', element: <Gate /> },
  { path: '/preview', element: <Preview /> },
  { path: '*', element: <Navigate to="/admin" replace /> },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <RouterProvider router={router} />
    </I18nProvider>
  </React.StrictMode>
);
