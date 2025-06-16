import { Database, Globe, TriangleAlert } from 'lucide-vue';
import type { Component } from 'vue';

export interface AppMapFindingReference {
  path: string;
  name: string;
  findingHash: string;
}

interface Event {
  path: string;
  defined_class: string;
  method: string;
  http_server_request?: {
    method: string;
    path: string;
  };
  sql_query?: {
    sql: string;
    database_type?: string;
  };
}

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
    appMapReferences?: AppMapFindingReference[];
    finding?: {
      description: string;
      message: string;
      locationLabel?: string;
      relatedEvents?: Event[];
      event?: Event;
      stack: string[];
    };
  };
}

export interface SuggestionStatus {
  status: 'fix-in-progress' | 'todo' | 'fixed' | 'dismissed';
  reason?: string;
  threadId?: string;
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
      return TriangleAlert;
    case 'sql':
      return Database;
    case 'http':
      return Globe;
    default:
      return undefined;
  }
}
