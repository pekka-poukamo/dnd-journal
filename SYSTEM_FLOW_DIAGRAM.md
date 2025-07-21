# D&D Journal App - System Flow Diagrams

## User Journey Flow

```mermaid
graph TD
    A[User Login] --> B[Dashboard]
    B --> C{Select Action}
    
    C --> D[Create Journal Entry]
    C --> E[View Existing Entries]
    C --> F[Manage Characters]
    C --> G[AI Roleplay Assistant]
    
    D --> D1[Choose Entry Type]
    D1 --> D2[Session Notes]
    D1 --> D3[Character Development]
    D1 --> D4[Campaign Lore]
    D1 --> D5[Quick Notes]
    
    D2 --> H[Rich Text Editor]
    D3 --> H
    D4 --> H
    D5 --> H
    
    H --> I[Add Tags]
    I --> J[Save Entry]
    J --> K[Auto-Index for Search]
    
    E --> L[Search/Filter]
    L --> M[View Entry Details]
    M --> N{Actions}
    N --> O[Edit Entry]
    N --> P[Generate AI Prompt]
    N --> Q[Share Entry]
    
    F --> R[Character Profile]
    R --> S[Update Stats/Backstory]
    S --> T[Save Character]
    
    G --> U[Select Context]
    U --> V[Choose Prompt Type]
    V --> W[Generate AI Response]
    W --> X[Save/Use Response]
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph "Frontend"
        UI[React Components]
        State[State Management]
        Cache[Local Cache]
    end
    
    subgraph "API Gateway"
        Auth[Authentication]
        Rate[Rate Limiting]
        Valid[Validation]
    end
    
    subgraph "Core Services"
        JS[Journal Service]
        AS[AI Service]
        US[User Service]
        SS[Search Service]
    end
    
    subgraph "External APIs"
        OpenAI[OpenAI API]
        Claude[Claude API]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL)]
        Redis[(Redis Cache)]
        ES[(Elasticsearch)]
        S3[(File Storage)]
    end
    
    UI --> Auth
    State --> Cache
    
    Auth --> Rate
    Rate --> Valid
    Valid --> JS
    Valid --> AS
    Valid --> US
    Valid --> SS
    
    AS --> OpenAI
    AS --> Claude
    
    JS --> PG
    JS --> ES
    JS --> S3
    
    US --> PG
    US --> Redis
    
    SS --> ES
    SS --> Redis
    
    AS --> Redis
```

## AI Context Building Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AI_Service
    participant Journal_Service
    participant Character_Service
    participant AI_API
    
    User->>Frontend: Request AI Prompt
    Frontend->>AI_Service: Generate Prompt Request
    
    AI_Service->>Character_Service: Get Character Profile
    Character_Service-->>AI_Service: Character Data
    
    AI_Service->>Journal_Service: Get Recent Entries
    Journal_Service-->>AI_Service: Journal History
    
    AI_Service->>AI_Service: Build Context
    
    AI_Service->>AI_API: Send Enhanced Prompt
    AI_API-->>AI_Service: AI Response
    
    AI_Service->>Journal_Service: Save AI Interaction
    AI_Service-->>Frontend: Return Response
    
    Frontend-->>User: Display AI Suggestions
```

## Database Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ CHARACTERS : owns
    USERS ||--o{ CAMPAIGNS : creates
    USERS ||--o{ JOURNAL_ENTRIES : writes
    USERS ||--o{ AI_PROMPTS : generates
    
    CAMPAIGNS ||--o{ CHARACTERS : contains
    CAMPAIGNS ||--o{ JOURNAL_ENTRIES : belongs_to
    CAMPAIGNS ||--o{ TAGS : has
    
    CHARACTERS ||--o{ JOURNAL_ENTRIES : features_in
    CHARACTERS ||--o{ AI_PROMPTS : relates_to
    
    JOURNAL_ENTRIES ||--o{ ENTRY_TAGS : tagged_with
    JOURNAL_ENTRIES ||--o{ AI_PROMPTS : inspires
    
    TAGS ||--o{ ENTRY_TAGS : applied_to
    
    USERS {
        uuid id PK
        string email
        string username
        string password_hash
        timestamp created_at
        enum subscription_tier
    }
    
    CAMPAIGNS {
        uuid id PK
        uuid dm_user_id FK
        string name
        text description
        boolean is_active
        timestamp created_at
    }
    
    CHARACTERS {
        uuid id PK
        uuid user_id FK
        uuid campaign_id FK
        string name
        string class
        string race
        integer level
        text backstory
        text personality_traits
    }
    
    JOURNAL_ENTRIES {
        uuid id PK
        uuid user_id FK
        uuid campaign_id FK
        uuid character_id FK
        string title
        text content
        enum entry_type
        date session_date
        boolean is_private
    }
    
    AI_PROMPTS {
        uuid id PK
        uuid user_id FK
        uuid entry_id FK
        uuid character_id FK
        enum prompt_type
        text input_context
        text generated_response
        timestamp created_at
    }
    
    TAGS {
        uuid id PK
        uuid campaign_id FK
        string name
        string color
    }
    
    ENTRY_TAGS {
        uuid entry_id FK
        uuid tag_id FK
    }
```

## Component Architecture

```mermaid
graph TB
    subgraph "Frontend Components"
        App[App Shell]
        
        subgraph "Layout Components"
            Header[Header/Navigation]
            Sidebar[Sidebar Menu]
            Footer[Footer]
        end
        
        subgraph "Feature Components"
            Dashboard[Dashboard]
            JournalEditor[Journal Editor]
            CharacterSheet[Character Sheet]
            AIAssistant[AI Assistant]
            SearchInterface[Search Interface]
        end
        
        subgraph "UI Components"
            RichText[Rich Text Editor]
            TagInput[Tag Input]
            DatePicker[Date Picker]
            Modal[Modal Dialog]
            Toast[Toast Notifications]
        end
        
        subgraph "Hooks & Utilities"
            AuthHook[useAuth]
            APIHook[useAPI]
            StorageHook[useLocalStorage]
            FormHook[useForm]
        end
    end
    
    App --> Header
    App --> Sidebar
    App --> Dashboard
    App --> Footer
    
    Dashboard --> JournalEditor
    Dashboard --> CharacterSheet
    Dashboard --> AIAssistant
    Dashboard --> SearchInterface
    
    JournalEditor --> RichText
    JournalEditor --> TagInput
    JournalEditor --> DatePicker
    
    CharacterSheet --> Modal
    AIAssistant --> Toast
    
    JournalEditor --> AuthHook
    CharacterSheet --> APIHook
    AIAssistant --> StorageHook
    SearchInterface --> FormHook
```

## API Endpoint Structure

```
/api/v1/
├── auth/
│   ├── POST /login
│   ├── POST /register
│   ├── POST /refresh
│   └── POST /logout
├── users/
│   ├── GET /profile
│   ├── PUT /profile
│   └── DELETE /account
├── campaigns/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   ├── DELETE /:id
│   └── POST /:id/invite
├── characters/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── journal/
│   ├── GET /entries
│   ├── POST /entries
│   ├── GET /entries/:id
│   ├── PUT /entries/:id
│   ├── DELETE /entries/:id
│   └── GET /search
├── ai/
│   ├── POST /generate-prompt
│   ├── GET /prompt-history
│   └── POST /save-interaction
├── tags/
│   ├── GET /
│   ├── POST /
│   ├── PUT /:id
│   └── DELETE /:id
└── files/
    ├── POST /upload
    ├── GET /:id
    └── DELETE /:id
```

## Deployment Flow

```mermaid
graph LR
    Dev[Development] --> Test[Testing]
    Test --> Stage[Staging]
    Stage --> Prod[Production]
    
    subgraph "CI/CD Pipeline"
        Code[Code Push] --> Build[Build & Test]
        Build --> Deploy[Deploy to Staging]
        Deploy --> Verify[Verification Tests]
        Verify --> Release[Release to Production]
    end
    
    subgraph "Infrastructure"
        Frontend[Vercel Frontend]
        Backend[Railway Backend]
        Database[Neon PostgreSQL]
        Cache[Redis Cloud]
        Search[Elasticsearch Cloud]
        Storage[AWS S3]
        CDN[Cloudflare CDN]
    end
    
    Release --> Frontend
    Release --> Backend
    Backend --> Database
    Backend --> Cache
    Backend --> Search
    Backend --> Storage
    Frontend --> CDN
```

This system flow documentation provides a comprehensive view of how users interact with the D&D journal app, how data flows through the system, and how the various components work together to deliver the core functionality.