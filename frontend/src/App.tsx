import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SearchProvider } from './contexts/SearchContext';
import { FilterProvider } from './contexts/FilterContext';
import AppRoutes from './routes/AppRoutes';
import { ToastContainer } from './components/ToastContainer';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LoadingProvider>
          <FilterProvider>
            <SearchProvider>
              <NotificationProvider>
                <div className="min-h-screen bg-gray-50">
                  <AppRoutes />
                  <ToastContainer position="top-right" maxVisible={5} />
                </div>
              </NotificationProvider>
            </SearchProvider>
          </FilterProvider>
        </LoadingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
