import React from 'react';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator'; // o como se llame tu navigator

export default function App() {
  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
}

