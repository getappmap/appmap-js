import { default as VUserMessage } from '@/components/chat/UserMessage.vue';
import './scss/vscode.scss';

export default {
  title: 'Pages/Chat/User Message',
  component: VUserMessage,
  argTypes: {},
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const CodeSnippet = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VUserMessage },
  template: `<v-user-message v-bind="$props"></v-user-message>`,
});

CodeSnippet.args = {
  id: 'system-message-id',
  message: `
Here's an update to the \`index\` action that includes pagination:

<!-- file: app/controllers/users_controller.rb -->
\`\`\`ruby
def hello_world
  puts "Hello, world!"
end
\`\`\`

\`\`\`html
<!--
here's
my 
comment!
-->
\`\`\`

\`\`\`ruby
<!-- file: app/controllers/users_controller.rb -->
def hello_world
  puts "I'm different!"
end
\`\`\`

\`\`\`plaintext
<!-- file: app/controllers/users_controller.rb -->
This is a partial snippet!`,
  complete: true,
};

export const MermaidDiagram = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VUserMessage },
  template: `<v-user-message v-bind="$props"></v-user-message>`,
});

MermaidDiagram.args = {
  id: 'system-message-id',
  message: `
Here are some diagrams:

\`\`\`mermaid
sequenceDiagram
    participant User
    participant ClientApp
    participant AuthServer
    participant Db
    participant MFAServer
    User->>ClientApp: Enter username and password
    ClientApp->>AuthServer: Send credentials
    AuthServer->>Db: Verify credentials
    Db-->>AuthServer: Credentials valid
    AuthServer->>MFAServer: Initiate MFA
    MFAServer-->>User: Send MFA prompt (e.g., SMS, Authenticator app)
    User->>MFAServer: Provide MFA code
    MFAServer-->>AuthServer: MFA verification successful
    AuthServer-->>ClientApp: MFA verified, provide JWT token
    ClientApp-->>User: Authentication successful, return JWT token
\`\`\`

\`\`\`mermaid
flowchart TD
    User-->|Enters Username and Password| ClientApp
    ClientApp-->|Sends Credentials| AuthServer
    AuthServer-->|Verifies Credentials| Db
    Db-->|Credentials Valid| AuthServer
    AuthServer-->|Initiates MFA| MFAServer
    MFAServer-->|"Sends MFA Prompt (SMS/Authenticator)"| User
    User-->|Provides MFA Code| MFAServer
    MFAServer-->|MFA Verification Successful| AuthServer
    AuthServer-->|Provides JWT Token| ClientApp
    ClientApp-->|Returns JWT Token| User
\`\`\`

\`\`\`mermaid
erDiagram
    USER {
        string id PK
        string username
        string password_hash
        string email
        boolean is_activated
        string mfa_type
    }

    CLIENT_APP {
        string id PK
        string name
        string redirect_uri
    }
    AUTH_SERVER {
        string id PK
        string client_id
        string client_secret
    }
    DATABASE {
        string id PK
        string user_id FK
        string credentials
    }
    MFA_SERVER {
        string id PK
        string user_id FK
        string mfa_token
        string mfa_type
    }
    USER ||--o{ DATABASE: \"stores\"
    USER ||--o{ MFA_SERVER: \"uses\"
    CLIENT_APP ||--o{ AUTH_SERVER: \"authenticates\"
    AUTH_SERVER ||--o{ DATABASE: \"verifies\"
    AUTH_SERVER ||--o{ USER: \"issues tokens to\"
    AUTH_SERVER ||--o{ MFA_SERVER: \"initiates MFA\"
    MFA_SERVER ||--o{ USER: \"verifies MFA code with\"
\`\`\``,
  complete: true,
};

export const Buttons = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VUserMessage },
  template: `<v-user-message v-bind="$props"></v-user-message>`,
});
Buttons.args = {
  id: 'system-message-id',
  message: `To implement a login page, we need to ensure the following considerations:

### Proposed Changes

#### Frontend (UI Changes):
1. **packages/client/src/components/LoginPage.jsx**
   - Create a new component for the login page.
   - Use input elements for the username and password fields.
   - Implement a form submission function that validates inputs and communicates with the backend.
   - Add state management for form inputs and potential error messages.
   - Apply styles to the login form for proper layout and visual appeal.

2. **packages/client/src/styles/LoginPage.css**
   - Create styles specific to the login page to ensure a user-friendly and responsive design.

[Generate code](event:generate-code) [Create a diagram](event:create-diagram)
`,
  complete: true,
};
