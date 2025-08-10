# Software Architecture & Features Overview

## 🏗️ Application Architecture

```mermaid
graph TB
    subgraph "🎨 User Interface Layer"
        UI[Vue 3 + TypeScript Interface]
        UI --> INPUT[Model URL Input]
        UI --> SEARCH[Search & Filter]
        UI --> CALENDAR[Calendar View]
        UI --> EXPORT[Export Panel]
        UI --> CARDS[Model Cards]
    end
    
    subgraph "⚡ Business Logic Layer"
        BL[Core Application Logic]
        BL --> API[Civitai API Integration]
        BL --> CACHE[Cache Management]
        BL --> MARKDOWN[Markdown Export]
        BL --> SEARCH_ENGINE[Search Engine]
    end
    
    subgraph "💾 Data Storage Layer"
        STORAGE[Data Persistence]
        STORAGE --> LOCAL[Browser LocalStorage]
        STORAGE --> JSON_FILES[JSON Export/Import]
        STORAGE --> DAILY[Daily Records]
    end
    
    subgraph "🛠️ External Services"
        CIVITAI[Civitai.com API]
        BROWSER[Browser APIs]
        TAURI[Tauri Framework]
    end
    
    UI --> BL
    BL --> STORAGE
    BL --> CIVITAI
    STORAGE --> BROWSER
    UI --> TAURI
    
    style UI fill:#e3f2fd
    style BL fill:#f3e5f5
    style STORAGE fill:#e8f5e8
    style CIVITAI fill:#fff3e0
```

## 🔄 Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant UI as User Interface
    participant Cache as Cache Manager
    participant API as Civitai API
    participant Storage as Local Storage
    
    Note over User,Storage: Model Addition Flow
    User->>UI: Enter Civitai URL
    UI->>API: Fetch model data
    API-->>UI: Return model info
    UI->>Cache: Save model data
    Cache->>Storage: Store in localStorage
    Cache->>Cache: Record daily save
    UI-->>User: Display model card
    
    Note over User,Storage: Search Flow
    User->>UI: Enter search query
    UI->>Cache: Search cached models
    Cache->>Storage: Query localStorage
    Storage-->>Cache: Return matching models
    Cache-->>UI: Filtered results
    UI-->>User: Display search results
    
    Note over User,Storage: Calendar Flow
    User->>UI: Click calendar date
    UI->>Cache: Get models for date
    Cache->>Storage: Query daily records
    Storage-->>Cache: Return date models
    Cache-->>UI: Models for date
    UI-->>User: Display date models
```

## 📋 Feature Matrix

| Feature | Description | Status | Access Method |
|---------|-------------|--------|---------------|
| 🔍 **Model Fetching** | Get model info from Civitai URLs | ✅ Active | Main input field |
| 🔎 **Smart Search** | Search across all model data | ✅ Active | Search box + advanced filters |
| 📅 **Calendar View** | GitHub-style activity calendar | ✅ Active | Calendar button |
| 📊 **Data Grid** | Overview of all data dates | ✅ Active | Data grid button |
| 💾 **Cache System** | Automatic local data storage | ✅ Active | Background + manual controls |
| 📤 **Export Options** | Multiple export formats | ✅ Active | Cache management panel |
| 📥 **Import System** | JSON data import | ✅ Active | Import button |
| 🌐 **Multi-language** | English/Chinese interface | ✅ Active | Language switcher |
| 🌓 **Theme Support** | Light/dark mode | ✅ Active | Auto-detection |
| 🖼️ **Image Gallery** | Model image carousel | ✅ Active | Model cards |
| 🏷️ **Metadata Display** | Training words, prompts, etc. | ✅ Active | Model cards |
| ⚙️ **Settings Panel** | Configuration options | ✅ Active | Various UI elements |

## 🎯 User Journey Maps

### New User Journey

```mermaid
journey
    title New User First Experience
    section Discovery
      Visit app: 5: User
      See interface: 4: User
      Read instructions: 3: User
    section First Model
      Copy Civitai URL: 4: User
      Paste and fetch: 5: User
      View model details: 5: User
      Explore features: 4: User
    section Exploration
      Try search: 4: User
      View calendar: 4: User
      Test export: 3: User
      Bookmark app: 5: User
```

### Power User Journey

```mermaid
journey
    title Advanced User Daily Workflow
    section Collection
      Add new models: 5: User
      Organize by date: 5: User
      Tag and categorize: 4: User
    section Research
      Search collection: 5: User
      Filter by criteria: 5: User
      Compare models: 4: User
    section Management
      Clean duplicates: 3: User
      Export backups: 4: User
      Sync devices: 4: User
```

## 🔧 Technical Components

### Frontend Stack
- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript for type safety
- **Styling**: TailwindCSS for responsive design
- **Icons**: Emoji + SVG icons
- **State**: Reactive refs and computed properties

### Data Management
- **Storage**: Browser localStorage
- **Caching**: Automatic model data caching
- **Export**: JSON, Markdown, ZIP formats
- **Search**: Client-side full-text search
- **Calendar**: Date-based data organization

### External Integration
- **API**: Civitai REST API
- **CORS**: Handled via browser/Tauri
- **Images**: Direct Civitai CDN links
- **Downloads**: Browser download API

## 🎨 UI/UX Patterns

### Design Principles
- **Responsive**: Mobile-first, desktop-optimized
- **Accessible**: Keyboard navigation, screen readers
- **Intuitive**: Clear visual hierarchy
- **Consistent**: Unified color scheme and typography

### Interaction Patterns
- **Progressive Disclosure**: Advanced features hidden by default
- **Contextual Actions**: Right-click menus for relevant options
- **Visual Feedback**: Loading states, success/error messages
- **Shortcuts**: Keyboard shortcuts and quick actions

## 🔮 Future Enhancements

```mermaid
graph LR
    A[Current Features] --> B[Planned v2.0]
    B --> C[Advanced Analytics]
    B --> D[Cloud Sync]
    B --> E[Collaboration]
    B --> F[Mobile App]
    
    C --> G[Usage Statistics]
    C --> H[Trend Analysis]
    D --> I[Multi-device Sync]
    D --> J[Backup Service]
    E --> K[Shared Collections]
    E --> L[Comments & Reviews]
    F --> M[iOS/Android Apps]
    F --> N[Offline Mode]
```

---

*Architecture documentation for developers and advanced users*
