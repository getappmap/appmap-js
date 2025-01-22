## Project Info - Diff Integration

1. Flowchart: Git Diff Process

This flowchart will illustrate the new process of obtaining and including diff information in the
project context.

```mermaid
flowchart TD
    A["Start: collectProjectInfos()"] --> B{"includeDiff?"}
    B -->|Yes| C["Get Working Diff"]
    B -->|No| G["Skip Diff Collection"]
    C --> D["Get Diff Log"]
    D --> E["Combine Working Diff and Diff Log"]
    E --> F["Add Diff to ProjectInfo"]
    F --> G
    G --> H["Return ProjectInfo"]
```

2. Sequence Diagram: Diff Integration in Explain Command

This sequence diagram will show how the diff information flows through the system when processing an
explain command.

```mermaid
sequenceDiagram
    participant User
    participant ExplainCommand
    participant ProjectInfoService
    participant Git
    participant Agent

    User->>ExplainCommand: Request explanation
    ExplainCommand->>ProjectInfoService: lookupProjectInfo(diffEnabled, baseBranch)
    ProjectInfoService->>Git: getWorkingDiff()
    Git-->>ProjectInfoService: Working diff
    ProjectInfoService->>Git: getDiffLog(baseBranch)
    Git-->>ProjectInfoService: Diff log
    ProjectInfoService-->>ExplainCommand: ProjectInfo with diff
    ExplainCommand->>Agent: Create with ProjectInfo
    Agent->>ExplainCommand: Response
    ExplainCommand->>User: Explanation with diff context
```

3. Class Diagram: Updated ProjectInfo Structure

This class diagram will show the changes to the ProjectInfo structure, highlighting the new diff
property.

```mermaid
classDiagram
    class ProjectInfo {
        +string directory
        +AppMapConfig appmapConfig
        +AppMapStats appmapStats
        +CodeEditorInfo codeEditor
        +string diff
    }
    class AppMapConfig {
        +string name
        +string language
        +string[] packages
    }
    class AppMapStats {
        +string name
        +string[] packages
        +string[] classes
        +string[] routes
        +string[] tables
        +number numAppMaps
    }
    class CodeEditorInfo {
        +string name
        +boolean installed
        +boolean activated
    }

    ProjectInfo --> AppMapConfig
    ProjectInfo --> AppMapStats
    ProjectInfo --> CodeEditorInfo
```

4. Entity-Relationship Diagram: ProjectInfo and Related Entities

This ERD will show how the ProjectInfo relates to other entities in the system, including the new
diff information.

```mermaid
erDiagram
    ProjectInfo ||--o| AppMapConfig : has
    ProjectInfo ||--o| AppMapStats : has
    ProjectInfo ||--o| CodeEditorInfo : has
    ProjectInfo ||--o| Diff : includes
    Diff ||--|{ WorkingDiff : contains
    Diff ||--|{ DiffLog : contains
    ProjectInfoService ||--o{ ProjectInfo : manages
    ExplainCommand ||--o| ProjectInfoService : uses
    Agent ||--o| ProjectInfo : consumes
```

These diagrams provide a comprehensive overview of the recent changes, focusing on the addition of
diff functionality to the ProjectInfo and how it's integrated into the existing system. They cover
the process flow, data structure changes, and relationships between different components affected by
these changes.
