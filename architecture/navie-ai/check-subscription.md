## Check Subscription Status

This feature ensures that users adhere to subscription limits during the conversation enrollment
process. It involves checking the user's subscription status and usage count to determine if they
can continue using the Navie AI service.

```
flowchart TD
    A["Start Conversation Enrollment"] --> B["Create Conversation Thread"]
    B --> C["Thread Created?"]
    C -->|No| D["Log Error and Continue"]
    C -->|Yes| E["Check Subscription"]
    E --> F["Subscription Active?"]
    F -->|No| G["Check Usage Count"]
    G --> H["Usage Count Below Limit?"]
    H -->|No| I["Return Status False with Subscription Required Message"]
    H -->|Yes| J["Usage Count at Warning Threshold?"]
    J -->|Yes| K["Return Status True with Warning Message"]
    J -->|No| L["Return Status True"]
    F -->|Yes| L["Return Status True"]
```

1. **Initiation of the Process**:

   - The sequence begins with a user or system request to initiate a conversation. This serves as
     the starting point, where necessary details for creating a conversation thread are gathered.

2. **Request for Conversation Thread Creation**:

   - The Navie API client formulates a request to create a new conversation thread. This request
     includes relevant model parameters and the project's context to ensure the thread is correctly
     configured.

3. **Receiving Conversation Thread Details**:

   - Once the request is processed by the Navie service, it responds with the conversation thread
     details. This includes information such as permissions, usage metrics, and subscription data.

4. **Checking of Subscription**:

   - The system checks the subscription status associated with the newly created conversation
     thread. This step is used to determine if the conversation can proceed according to the user's
     subscription plan and usage limits.

5. **Decision on Subscription Validity**:

   - At this juncture, the system assesses whether the subscription is active. If the subscription
     is active ("Yes" branch), the conversation can continue seamlessly.
   - If the subscription is inactive ("No" branch), the system checks the usage count to determine
     if the user is within the free usage limit.

6. **Checking Usage Count**:

   - The system evaluates the usage count to see if it is below the free usage limit. If the usage
     count is below the limit, the conversation can proceed.
   - If the usage count is at the warning threshold, a warning message is returned, but the
     conversation can still proceed.
   - If the usage count exceeds the limit, a subscription required message is returned, and the
     conversation cannot proceed.

7. **Completion of the Subscription Check Process**:
   - Regardless of the subscription outcome, the flow wraps up by completing the subscription check.
     If the subscription and usage count are valid, the interaction continues smoothly. If not,
     appropriate actions are taken based on the returned messages.

### Internal Dependencies

1. **Navie API Client**:

   - The client is responsible for sending requests to create conversation threads and receiving
     responses with thread details.

2. **Subscription and Usage Types**:

   - Types such as `Subscription`, `Usage`, and `ConversationThread` are used for handling
     subscription checks and usage metrics within the system.

3. **Functions and Services**:

   - Functions like `checkSubscription` are essential for verifying if the user has an active
     subscription and if their usage is within the allowed limits.

4. **Thread Management**:

   - Components related to managing thread states, including enrolling and interacting with
     conversation threads.

5. **Report and Handle Errors**:
   - Mechanisms to log and inform users about subscription-related issues, possibly involving
     functions like `reportFetchError`.

### External Dependencies

1. **AppMap Service**:

   - External service for handling requests related to conversation thread management and enforcing
     subscription policies.

2. **Socket.IO**:

   - Utilized for maintaining real-time communication between the Navie client and service.

3. **Configured Models and APIs**:
   - External models and APIs specified in the configuration, necessary for authenticating and
     authorizing requests made by the client.

```

```
