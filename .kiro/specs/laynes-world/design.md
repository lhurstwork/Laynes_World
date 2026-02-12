# Design Document: Layne's World

## Overview

Layne's World is a personal dashboard webapp built as a single-page application (SPA) that aggregates multiple information sources into a unified interface. The architecture follows a modular widget-based design where each feature (news, tasks, calendar, YouTube, deals) operates as an independent component with its own data fetching and rendering logic.

The system uses a client-side architecture with external API integrations for data sources. Authentication is handled via OAuth 2.0 for calendar services, and API keys for news and YouTube services. Local storage provides persistence for tasks and user preferences.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Dashboard Application (SPA)               │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │  News    │ │  Tasks   │ │ Calendar │ │ YouTube  │ │  │
│  │  │  Widget  │ │  Widget  │ │  Widget  │ │  Widget  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  │  ┌──────────┐                                         │  │
│  │  │  Deals   │                                         │  │
│  │  │  Widget  │                                         │  │
│  │  └──────────┘                                         │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │         State Management Layer                  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │         API Integration Layer                   │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  News    │ │  Google  │ │ Microsoft│ │ YouTube  │       │
│  │  APIs    │ │ Calendar │ │ Outlook  │ │   API    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐                                                │
│  │  Deals   │                                                │
│  │  APIs    │                                                │
│  └──────────┘                                                │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: React with TypeScript for type safety and component-based architecture
- **State Management**: React Context API for global state, local component state for widget-specific data
- **Styling**: CSS Modules or Tailwind CSS for responsive design
- **HTTP Client**: Axios for API requests with interceptors for error handling
- **Authentication**: OAuth 2.0 libraries (Google OAuth, Microsoft MSAL)
- **Storage**: Browser LocalStorage for tasks and preferences, SessionStorage for temporary auth tokens
- **Build Tool**: Vite for fast development and optimized production builds

## Components and Interfaces

### Core Application Components

#### Dashboard Container
The main application container that orchestrates widget rendering and layout management.

```typescript
interface DashboardProps {
  userId: string;
}

interface DashboardState {
  widgets: WidgetConfig[];
  layout: LayoutConfig;
  isLoading: boolean;
  error: Error | null;
}

class Dashboard {
  render(): JSX.Element;
  loadWidgets(): Promise<void>;
  handleWidgetError(widgetId: string, error: Error): void;
}
```

#### Widget Base Interface
All widgets implement this common interface for consistent behavior.

```typescript
interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  isLoading: boolean;
  error: Error | null;
  
  initialize(): Promise<void>;
  refresh(): Promise<void>;
  render(): JSX.Element;
  handleError(error: Error): void;
}

enum WidgetType {
  NEWS = 'news',
  TASKS = 'tasks',
  CALENDAR = 'calendar',
  YOUTUBE = 'youtube',
  DEALS = 'deals'
}
```

### News Aggregator Component

```typescript
interface NewsArticle {
  id: string;
  title: string;
  source: string;
  category: NewsCategory;
  publishedAt: Date;
  summary: string;
  url: string;
  imageUrl?: string;
}

enum NewsCategory {
  BUSINESS = 'business',
  TECHNOLOGY = 'technology',
  ENTERTAINMENT = 'entertainment'
}

interface NewsWidgetState {
  articles: NewsArticle[];
  selectedCategory: NewsCategory | 'all';
  lastRefresh: Date;
}

class NewsWidget implements Widget {
  fetchNews(category?: NewsCategory): Promise<NewsArticle[]>;
  filterByCategory(category: NewsCategory): NewsArticle[];
  openArticle(url: string): void;
}
```

### Task Manager Component

```typescript
interface Task {
  id: string;
  description: string;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskWidgetState {
  tasks: Task[];
  filter: TaskFilter;
}

enum TaskFilter {
  ALL = 'all',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

class TaskWidget implements Widget {
  createTask(description: string): Task;
  updateTask(id: string, updates: Partial<Task>): Task;
  deleteTask(id: string): void;
  toggleComplete(id: string): Task;
  persistTasks(): void;
  loadTasks(): Task[];
}
```

### Calendar Integration Component

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  source: CalendarSource;
  description?: string;
}

enum CalendarSource {
  GOOGLE = 'google',
  OUTLOOK = 'outlook'
}

interface CalendarWidgetState {
  events: CalendarEvent[];
  connectedAccounts: CalendarSource[];
  dateRange: DateRange;
}

interface DateRange {
  start: Date;
  end: Date;
}

class CalendarWidget implements Widget {
  authenticateGoogle(): Promise<void>;
  authenticateOutlook(): Promise<void>;
  fetchGoogleEvents(dateRange: DateRange): Promise<CalendarEvent[]>;
  fetchOutlookEvents(dateRange: DateRange): Promise<CalendarEvent[]>;
  mergeEvents(events: CalendarEvent[]): CalendarEvent[];
}
```

### YouTube Feed Component

```typescript
interface YouTubeVideo {
  id: string;
  title: string;
  channelName: string;
  channelId: string;
  thumbnail: string;
  uploadDate: Date;
  url: string;
  type: VideoType;
}

enum VideoType {
  NEW_RELEASE = 'new_release',
  RECOMMENDED = 'recommended'
}

interface YouTubeWidgetState {
  videos: YouTubeVideo[];
  selectedTab: VideoType | 'all';
}

class YouTubeWidget implements Widget {
  fetchNewReleases(): Promise<YouTubeVideo[]>;
  fetchRecommended(): Promise<YouTubeVideo[]>;
  openVideo(url: string): void;
}
```

### Deals Tracker Component

```typescript
interface TechDeal {
  id: string;
  productName: string;
  discountPercentage: number;
  originalPrice: number;
  salePrice: number;
  source: string;
  url: string;
  expirationDate: Date;
  status: DealStatus;
  imageUrl?: string;
}

enum DealStatus {
  CURRENT = 'current',
  UPCOMING = 'upcoming',
  EXPIRED = 'expired'
}

interface DealsWidgetState {
  deals: TechDeal[];
  selectedStatus: DealStatus | 'all';
  lastRefresh: Date;
}

class DealsWidget implements Widget {
  fetchDeals(): Promise<TechDeal[]>;
  filterByStatus(status: DealStatus): TechDeal[];
  openDeal(url: string): void;
  scheduleDailyRefresh(): void;
}
```

### API Integration Layer

```typescript
interface APIClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data: any, config?: RequestConfig): Promise<T>;
  handleError(error: Error): void;
  retry(request: () => Promise<any>, maxRetries: number): Promise<any>;
}

interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

class NewsAPIClient {
  fetchArticles(category: NewsCategory): Promise<NewsArticle[]>;
}

class GoogleCalendarClient {
  authenticate(): Promise<string>;
  fetchEvents(accessToken: string, dateRange: DateRange): Promise<CalendarEvent[]>;
}

class OutlookCalendarClient {
  authenticate(): Promise<string>;
  fetchEvents(accessToken: string, dateRange: DateRange): Promise<CalendarEvent[]>;
}

class YouTubeAPIClient {
  fetchSubscriptions(accessToken: string): Promise<YouTubeVideo[]>;
  fetchRecommendations(): Promise<YouTubeVideo[]>;
}

class DealsAPIClient {
  fetchCurrentDeals(): Promise<TechDeal[]>;
  fetchUpcomingDeals(): Promise<TechDeal[]>;
}
```

### Storage Layer

```typescript
interface StorageService {
  save<T>(key: string, value: T): void;
  load<T>(key: string): T | null;
  remove(key: string): void;
  clear(): void;
}

class LocalStorageService implements StorageService {
  save<T>(key: string, value: T): void;
  load<T>(key: string): T | null;
  remove(key: string): void;
  clear(): void;
}

interface AuthTokenStore {
  saveToken(service: string, token: string): void;
  getToken(service: string): string | null;
  removeToken(service: string): void;
  isTokenValid(service: string): boolean;
}
```

## Data Models

### Task Data Model

```typescript
interface Task {
  id: string;              // UUID
  description: string;     // Task description (1-500 characters)
  isComplete: boolean;     // Completion status
  createdAt: Date;        // Creation timestamp
  updatedAt: Date;        // Last update timestamp
}

// Validation rules:
// - description: non-empty, max 500 characters
// - id: valid UUID format
// - createdAt <= updatedAt
```

### News Article Data Model

```typescript
interface NewsArticle {
  id: string;              // Unique identifier from source
  title: string;           // Article title
  source: string;          // News source name
  category: NewsCategory;  // Business, Technology, or Entertainment
  publishedAt: Date;       // Publication timestamp
  summary: string;         // Article summary (max 500 characters)
  url: string;            // Full article URL
  imageUrl?: string;      // Optional thumbnail image
}

// Validation rules:
// - url: valid HTTP/HTTPS URL
// - publishedAt: not in the future
// - category: must be valid NewsCategory enum value
```

### Calendar Event Data Model

```typescript
interface CalendarEvent {
  id: string;              // Event ID from source
  title: string;           // Event title
  startTime: Date;         // Event start time
  endTime: Date;           // Event end time
  location?: string;       // Optional location
  source: CalendarSource;  // Google or Outlook
  description?: string;    // Optional event description
}

// Validation rules:
// - startTime < endTime
// - source: must be valid CalendarSource enum value
```

### YouTube Video Data Model

```typescript
interface YouTubeVideo {
  id: string;              // YouTube video ID
  title: string;           // Video title
  channelName: string;     // Channel name
  channelId: string;       // Channel ID
  thumbnail: string;       // Thumbnail URL
  uploadDate: Date;        // Upload timestamp
  url: string;            // Full video URL
  type: VideoType;        // New release or recommended
}

// Validation rules:
// - url: valid YouTube URL format
// - thumbnail: valid HTTP/HTTPS URL
// - type: must be valid VideoType enum value
```

### Tech Deal Data Model

```typescript
interface TechDeal {
  id: string;                  // Unique deal identifier
  productName: string;         // Product name
  discountPercentage: number;  // Discount percentage (0-100)
  originalPrice: number;       // Original price (positive)
  salePrice: number;          // Sale price (positive)
  source: string;             // Deal source/retailer
  url: string;                // Deal page URL
  expirationDate: Date;       // Deal expiration
  status: DealStatus;         // Current, upcoming, or expired
  imageUrl?: string;          // Optional product image
}

// Validation rules:
// - discountPercentage: 0 <= value <= 100
// - originalPrice > salePrice
// - salePrice > 0
// - url: valid HTTP/HTTPS URL
// - status: must be valid DealStatus enum value
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Widget Initialization Properties

Property 1: Widget data fetching on initialization
*For any* widget (News, YouTube, Deals, Calendar), when the widget is initialized, it should fetch and populate its data from the appropriate source.
**Validates: Requirements 1.1, 3.4, 4.1, 4.2, 5.1, 5.2**

### News Aggregator Properties

Property 2: News article rendering completeness
*For any* news article, when rendered, the output should contain the article title, source, publication date, and summary.
**Validates: Requirements 1.2**

Property 3: News category organization
*For any* collection of news articles, when organized by category, all articles in a category section should have that category value, and articles from different categories should be in separate sections.
**Validates: Requirements 1.5**

Property 4: News refresh updates content
*For any* news widget state, when refresh is called, the resulting articles should have publication dates greater than or equal to the previous fetch.
**Validates: Requirements 1.4**

### Task Manager Properties

Property 5: Task creation uniqueness
*For any* task description, when a task is created, it should be assigned a unique identifier that differs from all existing task identifiers.
**Validates: Requirements 2.1**

Property 6: Task persistence round-trip
*For any* task, when saved to storage and then loaded, the loaded task should be equivalent to the original task.
**Validates: Requirements 2.6, 6.1, 6.3**

Property 7: Task deletion removes completely
*For any* task in the task list, when deleted, the task should no longer appear in the task list or in persisted storage.
**Validates: Requirements 2.3**

Property 8: Task updates persist
*For any* task and any valid update (description change or completion toggle), when the task is updated, the change should be reflected in both the in-memory state and persisted storage.
**Validates: Requirements 2.2, 2.4**

Property 9: Task display completeness
*For any* set of persisted tasks, when the task widget renders, all tasks should be displayed with their current completion status.
**Validates: Requirements 2.5**

### Calendar Integration Properties

Property 10: Calendar event rendering completeness
*For any* calendar event, when rendered, the output should contain the event title, start time, end time, and location (if present).
**Validates: Requirements 3.3**

Property 11: Calendar events chronological ordering
*For any* collection of calendar events, when displayed, the events should be sorted in ascending order by start time.
**Validates: Requirements 3.5**

Property 12: Calendar error isolation
*For any* calendar source (Google or Outlook), when that source fails to provide data, the widget should display an error message for that source but continue functioning and displaying data from other sources.
**Validates: Requirements 3.6**

Property 13: Calendar data retrieval
*For any* authenticated calendar account (Google or Outlook), when events are fetched for a date range, the returned events should all have start times within that date range.
**Validates: Requirements 3.1, 3.2**

### YouTube Feed Properties

Property 14: YouTube video rendering completeness
*For any* YouTube video, when rendered, the output should contain the video thumbnail, title, channel name, and upload date.
**Validates: Requirements 4.3**

Property 15: YouTube video categorization
*For any* collection of YouTube videos, when organized by type, all videos in the "New Releases" section should have type NEW_RELEASE, and all videos in "Recommended" should have type RECOMMENDED.
**Validates: Requirements 4.5**

### Deals Tracker Properties

Property 16: Deal rendering completeness
*For any* tech deal, when rendered, the output should contain the product name, discount percentage, price, deal source, and expiration date.
**Validates: Requirements 5.3**

Property 17: Deal status categorization
*For any* collection of deals, when organized by status, all deals in the "Current Deals" section should have status CURRENT, and all deals in "Upcoming Deals" should have status UPCOMING.
**Validates: Requirements 5.4**

### External Link Properties

Property 18: External link navigation
*For any* clickable item with an external URL (news article, YouTube video, or deal), when clicked, the system should open that URL in a new browser tab.
**Validates: Requirements 1.3, 4.4, 5.5**

### Data Persistence Properties

Property 19: Authentication token storage round-trip
*For any* authentication token and service identifier, when the token is saved and then retrieved, the retrieved token should equal the original token.
**Validates: Requirements 6.2**

Property 20: Token expiration handling
*For any* expired authentication token, when the system attempts to use it, the system should detect the expiration and trigger the re-authentication flow.
**Validates: Requirements 6.4**

### Responsive Layout Properties

Property 21: Responsive layout adaptation
*For any* viewport width, when the dashboard is rendered, the layout should use multi-column layout for desktop widths (≥1024px), adjusted layout for tablet widths (768-1023px), and single-column layout for mobile widths (<768px).
**Validates: Requirements 7.1, 7.2, 7.3**

### Error Handling Properties

Property 22: Widget error isolation
*For any* widget that encounters an error, when that widget fails, it should display an error message within its own container, and all other widgets should continue to function normally.
**Validates: Requirements 8.1**

Property 23: Network retry with exponential backoff
*For any* failed network request, when retried, the delays between retry attempts should increase exponentially (e.g., 1s, 2s, 4s, 8s).
**Validates: Requirements 8.2**

Property 24: Authentication error handling
*For any* authentication failure, when it occurs, the system should display a clear error message and provide UI controls for re-authentication.
**Validates: Requirements 8.3**

Property 25: API fallback behavior
*For any* external API that becomes unavailable, when data is requested, the system should return cached data if available, or display an appropriate error message if no cache exists.
**Validates: Requirements 8.4**

Property 26: Error logging without sensitive data
*For any* error that occurs, when logged, the log entry should contain error details but should not contain authentication tokens, passwords, or other sensitive user data.
**Validates: Requirements 8.5**

### Data Validation Properties

Property 27: Task description validation
*For any* string used as a task description, when validated, strings that are empty or exceed 500 characters should be rejected.
**Validates: Requirements 2.1** (implicit validation requirement)

Property 28: Calendar event time ordering
*For any* calendar event, the start time should be strictly less than the end time.
**Validates: Requirements 3.3** (implicit validation requirement)

Property 29: Deal price consistency
*For any* tech deal, the sale price should be less than the original price, and both should be positive values.
**Validates: Requirements 5.3** (implicit validation requirement)

Property 30: Deal discount calculation
*For any* tech deal, the discount percentage should equal ((originalPrice - salePrice) / originalPrice) * 100, rounded to the nearest integer.
**Validates: Requirements 5.3** (implicit validation requirement)

## Error Handling

### Error Categories

1. **Network Errors**: Failed API requests, timeouts, connection issues
2. **Authentication Errors**: Invalid tokens, expired sessions, OAuth failures
3. **Validation Errors**: Invalid user input, malformed data
4. **Widget Errors**: Component-specific failures that shouldn't crash the entire app
5. **Storage Errors**: LocalStorage quota exceeded, storage unavailable

### Error Handling Strategy

#### Widget-Level Error Boundaries
Each widget is wrapped in an error boundary that catches rendering errors and displays a fallback UI. This prevents one widget's failure from crashing the entire dashboard.

```typescript
class WidgetErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('Widget Error', { error, errorInfo, widgetId: this.props.widgetId });
  }
  
  render() {
    if (this.state.hasError) {
      return <WidgetErrorFallback error={this.state.error} onRetry={this.props.onRetry} />;
    }
    return this.props.children;
  }
}
```

#### Network Request Retry Logic
Failed network requests are automatically retried with exponential backoff:

```typescript
async function retryWithBackoff<T>(
  request: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await request();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}
```

#### Authentication Error Recovery
When authentication fails or tokens expire:
1. Display clear error message to user
2. Provide "Re-authenticate" button
3. Preserve user's current state
4. Redirect to OAuth flow
5. Restore state after successful re-authentication

#### Graceful Degradation
When external services are unavailable:
1. Display cached data if available (with timestamp indicating age)
2. Show informative error message if no cache exists
3. Provide manual refresh button
4. Continue displaying other functional widgets

#### Error Logging
All errors are logged with:
- Error type and message
- Stack trace
- User context (non-sensitive)
- Timestamp
- Widget/component identifier

Sensitive data (tokens, passwords, personal info) is redacted before logging.

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property-based tests**: Verify universal properties across all inputs

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property-based tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library**: fast-check (for TypeScript/JavaScript)

**Configuration**:
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `// Feature: laynes-world, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: laynes-world, Property 5: Task creation uniqueness
test('task creation assigns unique identifiers', () => {
  fc.assert(
    fc.property(
      fc.array(fc.string({ minLength: 1, maxLength: 500 }), { minLength: 2, maxLength: 100 }),
      (descriptions) => {
        const taskManager = new TaskManager();
        const tasks = descriptions.map(desc => taskManager.createTask(desc));
        const ids = tasks.map(task => task.id);
        const uniqueIds = new Set(ids);
        
        expect(uniqueIds.size).toBe(ids.length);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Framework**: Jest with React Testing Library

**Focus Areas**:
- Specific user interaction flows
- Edge cases (empty inputs, boundary values)
- Error conditions and recovery
- Component integration points
- Mock external API responses

**Example Unit Test**:
```typescript
test('task manager rejects empty task descriptions', () => {
  const taskManager = new TaskManager();
  
  expect(() => taskManager.createTask('')).toThrow('Task description cannot be empty');
  expect(() => taskManager.createTask('   ')).toThrow('Task description cannot be empty');
});
```

### Integration Testing

**Scope**: Test interactions between widgets and shared services
- Task persistence with LocalStorage
- Calendar sync with multiple accounts
- Error boundary behavior across widgets
- Authentication flow end-to-end

### Test Coverage Goals

- **Unit test coverage**: Minimum 80% code coverage
- **Property test coverage**: All 30 correctness properties implemented
- **Integration test coverage**: All critical user flows
- **Error handling coverage**: All error categories tested

### Testing Best Practices

1. **Avoid excessive unit tests**: Property-based tests handle input variation; unit tests should focus on specific scenarios
2. **Mock external dependencies**: Use mock API clients for news, YouTube, calendar, and deals services
3. **Test error isolation**: Verify that widget failures don't cascade
4. **Test responsive behavior**: Use viewport mocking to test layout adaptation
5. **Test persistence**: Verify round-trip behavior for all persisted data
6. **Test authentication flows**: Mock OAuth providers and test token handling
