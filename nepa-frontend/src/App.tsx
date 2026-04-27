import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Footer from './components/Footer';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import DatePicker from './components/DatePicker';
import Dashboard from './components/Dashboard';
import './App.css';

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <KeyboardShortcuts />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route 
              path="/date-demo" 
              element={
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold mb-6">Date Picker Demo</h1>
                  <div className="max-w-md">
                    <DatePicker
                      value={selectedDate}
                      onChange={setSelectedDate}
                      placeholder="Select a date"
                      className="mb-4"
                    />
                    {selectedDate && (
                      <p className="text-gray-600">
                        Selected date: {selectedDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              } 
            />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
};

export default App;