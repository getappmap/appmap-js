## Navie Chat Welcome Message

The welcome message is a dynamic greeting that appears when the user opens the Navie Chat window.
The message is based on the user's current workspace activity and the status of their projects.

```mermaid
sequenceDiagram
    participant CS as ChatSearch
    participant RPC as AppMapRPC
    participant NM as NavieMetadata
    participant VM as VWelcomeMessage

    CS->>RPC: Initialize RPC client
    activate CS

    CS->>RPC: Request metadata
    activate RPC
    RPC->>NM: navieMetadataV1()
    activate NM

    alt No projects open
        NM-->>RPC: welcomeMessage with "no project open"
    else Has git changes
        NM->>NM: getDiffLog()
        NM->>NM: getWorkingDiff()
        NM-->>RPC: welcomeMessage with activity suggestions
    else No changes
        NM-->>RPC: welcomeMessage "haven't started working"
    end

    deactivate NM
    RPC-->>CS: Return metadata response
    deactivate RPC

    CS->>VM: Render with welcomeMessage
    activate VM

    alt Has dynamic message
        VM->>VM: Parse Markdown
        VM->>VM: Sanitize content
        VM-->>CS: Display formatted message
    else Static only
        VM-->>CS: Display "Hi, I'm Navie"
    end

    deactivate VM
    deactivate CS

    Note over CS,VM: Message updates when<br/>context changes
```

This sequence diagram shows:

1. Initial loading:
   - ChatSearch initializes and creates RPC client
   - Requests metadata from the NavieMetadata service
2. Metadata processing:
   - NavieMetadata determines the appropriate message based on:
     - Whether projects are open
     - Git changes and working diff status
     - Current workspace activity
3. Message rendering:

   - VWelcomeMessage receives the content
   - Processes markdown if dynamic content exists
   - Sanitizes the content
   - Renders either dynamic or static message

4. The system maintains this state and updates when the context changes or new messages arrive
