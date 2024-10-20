"use client";

import React from 'react';
import { ResourcesDashboard } from './resources/ResourcesDashboard';
import { AIAssistantCard } from './assistant/AIAssistantCard';
import { Provider } from 'react-redux';
import { store } from '../store';

export default function DashboardPage() {
  return (
    <Provider store={store}>
      <div className="container mx-auto p-4 space-y-4">
        <ResourcesDashboard />
        <AIAssistantCard />
      </div>
    </Provider>
    
  );
}
