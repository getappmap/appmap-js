import { AlertTriangle, Database, Globe } from 'lucide-vue';
import type { Component } from 'vue';

export interface Suggestion {
  id: string;
  title: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  location: string;
  code: string;
  category: 'security' | 'sql' | 'http';
  runtime?: {
    stackTrace?: string;
    sequenceDiagram?: string;
  };
}

export interface DismissedSuggestion {
  id: string;
  reason: string;
  status?: 'applied' | 'todo' | 'fixed' | 'dismissed';
}

export interface TestCoverageItem {
  feature: string;
  coverage: string;
}

export interface Test {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
}

export interface TestDetails {
  file: string;
  location: string;
  tests: Test[];
}

export interface Feature {
  description: string;
  hasCoverage: boolean;
  testDetails?: TestDetails;
  aiPrompt?: string;
}

export interface DismissedFeature {
  index: number;
  reason: string;
}

export interface CodeLabelItem {
  label: string;
  description: string;
  location: string;
}

export function getCategoryIconComponent(category: string): Component | undefined {
  switch (category) {
    case 'security':
      return AlertTriangle;
    case 'sql':
      return Database;
    case 'http':
      return Globe;
    default:
      return undefined;
  }
}
