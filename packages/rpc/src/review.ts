export namespace ReviewRpc {
  export interface Suggestion {
    id: string;
    title: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    location: string;
    code: string;
    category: string; // 'security' | 'sql' | 'http'
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
    status?: 'pass' | 'fail';
    message?: string;
  }

  export interface TestDetails {
    file: string;
    location: string;
    tests: Test[];
  }

  export interface Feature {
    description: string;
    hasCoverage?: boolean;
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

  export interface Review {
    suggestions: Suggestion[];
    dismissedSuggestions: DismissedSuggestion[];
    testCoverage: TestCoverageItem[];
    features: Feature[];
    dismissedFeatures: DismissedFeature[];
    codeLabels: CodeLabelItem[];
  }
}
