# Implementation Plan: Layne's World

## Overview

This implementation plan breaks down the Layne's World personal dashboard into incremental coding tasks. The approach follows a bottom-up strategy: building core infrastructure first, then implementing individual widgets, and finally integrating everything into the complete dashboard. Each task builds on previous work, with testing integrated throughout to catch errors early.

## Tasks

- [ ] 1. Set up project structure and core infrastructure
  - Initialize React + TypeScript project with Vite
  - Configure TypeScript with strict mode
  - Set up CSS framework (Tailwind CSS)
  - Install dependencies: axios, fast-check, jest, react-testing-library
  - Create directory structure: src/components, src/services, src/types, src/utils, src/tests
  - _Requirements: All (foundational)_

- [x] 2. Implement core types and interfaces
  - [x] 2.1 Create TypeScript type definitions
    - Define all data model interfaces (Task, NewsArticle, CalendarEvent, YouTubeVideo, TechDeal)
    - Define enum types (NewsCategory, TaskFilter, CalendarSource, VideoType, DealStatus, WidgetType)
    - Define component interfaces (Widget, DashboardState, WidgetConfig)
    - Define service interfaces (APIClient, StorageService, AuthTokenStore)
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_
  
  - [ ]* 2.2 Write property tests for data validation
    - **Property 27: Task description validation**
    - **Validates: Requirements 2.1**
    - **Property 28: Calendar event time ordering**
    - **Validates: Requirements 3.3**
    - **Property 29: Deal price consistency**
    - **Validates: Requirements 5.3**
    - **Property 30: Deal discount calculation**
    - **Validates: Requirements 5.3**

- [x] 3. Implement storage layer
  - [x] 3.1 Create LocalStorageService
    - Implement save, load, remove, and clear methods
    - Add error handling for quota exceeded
    - Add JSON serialization/deserialization
    - _Requirements: 6.1, 6.3_
  
  - [x] 3.2 Create AuthTokenStore
    - Implement token save/retrieve/remove methods
    - Add token expiration checking
    - Add secure storage with encryption consideration
    - _Requirements: 6.2, 6.4_
  
  - [x] 3.3 Write property tests for storage
    - **Property 6: Task persistence round-trip**
    - **Validates: Requirements 2.6, 6.1, 6.3**
    - **Property 19: Authentication token storage round-trip**
    - **Validates: Requirements 6.2**
  
  - [x] 3.4 Write unit tests for storage edge cases
    - Test storage quota exceeded handling
    - Test invalid JSON handling
    - Test missing key handling
    - _Requirements: 6.1, 6.2_

- [x] 4. Implement API client infrastructure
  - [x] 4.1 Create base APIClient class
    - Implement get and post methods with axios
    - Add request/response interceptors
    - Add timeout configuration
    - _Requirements: 8.2, 8.4_
  
  - [x] 4.2 Implement retry logic with exponential backoff
    - Create retryWithBackoff utility function
    - Add configurable max retries and base delay
    - Add error logging
    - _Requirements: 8.2_
  
  - [x] 4.3 Write property test for retry logic
    - **Property 23: Network retry with exponential backoff**
    - **Validates: Requirements 8.2**
  
  - [ ]* 4.4 Write unit tests for API client
    - Test successful requests
    - Test timeout handling
    - Test error responses
    - _Requirements: 8.2, 8.4_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Task Manager widget
  - [ ] 6.1 Create Task data model with validation
    - Implement Task interface
    - Add validation functions (description length, non-empty)
    - Add UUID generation for task IDs
    - _Requirements: 2.1_
  
  - [ ] 6.2 Implement TaskManager service
    - Implement createTask, updateTask, deleteTask, toggleComplete methods
    - Integrate with LocalStorageService for persistence
    - Add task filtering logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ] 6.3 Create TaskWidget React component
    - Build UI for task list display
    - Add input field for new tasks
    - Add buttons for complete/delete actions
    - Add inline editing for task descriptions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 6.4 Write property tests for TaskManager
    - **Property 5: Task creation uniqueness**
    - **Validates: Requirements 2.1**
    - **Property 7: Task deletion removes completely**
    - **Validates: Requirements 2.3**
    - **Property 8: Task updates persist**
    - **Validates: Requirements 2.2, 2.4**
    - **Property 9: Task display completeness**
    - **Validates: Requirements 2.5**
  
  - [ ]* 6.5 Write unit tests for TaskWidget
    - Test task creation with empty input
    - Test task completion toggle
    - Test task deletion
    - Test task editing
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 7. Implement News Aggregator widget
  - [ ] 7.1 Create NewsArticle data model
    - Implement NewsArticle interface
    - Add validation for URLs and dates
    - Define NewsCategory enum
    - _Requirements: 1.1, 1.2_
  
  - [ ] 7.2 Create NewsAPIClient service
    - Implement fetchArticles method
    - Add category filtering
    - Integrate with base APIClient
    - Mock API endpoints for development
    - _Requirements: 1.1, 1.4_
  
  - [ ] 7.3 Create NewsWidget React component
    - Build UI for article list display
    - Add category tabs/filters
    - Add article cards with title, source, date, summary
    - Add click handler to open articles in new tab
    - Add refresh button
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 7.4 Write property tests for NewsWidget
    - **Property 2: News article rendering completeness**
    - **Validates: Requirements 1.2**
    - **Property 3: News category organization**
    - **Validates: Requirements 1.5**
    - **Property 4: News refresh updates content**
    - **Validates: Requirements 1.4**
  
  - [ ]* 7.5 Write unit tests for NewsAPIClient
    - Test API response parsing
    - Test error handling
    - Test category filtering
    - _Requirements: 1.1, 1.4_

- [ ] 8. Implement Calendar Integration widget
  - [ ] 8.1 Create CalendarEvent data model
    - Implement CalendarEvent interface
    - Add validation for time ordering
    - Define CalendarSource enum
    - _Requirements: 3.3_
  
  - [ ] 8.2 Create GoogleCalendarClient service
    - Implement OAuth authentication flow
    - Implement fetchEvents method
    - Add date range filtering
    - Mock Google Calendar API for development
    - _Requirements: 3.1_
  
  - [ ] 8.3 Create OutlookCalendarClient service
    - Implement OAuth authentication flow (MSAL)
    - Implement fetchEvents method
    - Add date range filtering
    - Mock Outlook API for development
    - _Requirements: 3.2_
  
  - [ ] 8.4 Create CalendarWidget React component
    - Build UI for event list display
    - Add authentication buttons for Google/Outlook
    - Display events in chronological order
    - Show event details (title, time, location)
    - Add error handling for failed sources
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 8.5 Write property tests for CalendarWidget
    - **Property 10: Calendar event rendering completeness**
    - **Validates: Requirements 3.3**
    - **Property 11: Calendar events chronological ordering**
    - **Validates: Requirements 3.5**
    - **Property 12: Calendar error isolation**
    - **Validates: Requirements 3.6**
    - **Property 13: Calendar data retrieval**
    - **Validates: Requirements 3.1, 3.2**
  
  - [ ]* 8.6 Write unit tests for calendar clients
    - Test OAuth flow
    - Test event fetching
    - Test date range filtering
    - Test error handling
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement YouTube Feed widget
  - [x] 10.1 Create YouTubeVideo data model
    - Implement YouTubeVideo interface
    - Add URL validation
    - Define VideoType enum
    - _Requirements: 4.3_
  
  - [x] 10.2 Create YouTubeAPIClient service
    - Implement fetchNewReleases method
    - Implement fetchRecommended method
    - Integrate with YouTube Data API
    - Mock YouTube API for development
    - _Requirements: 4.1, 4.2_
  
  - [x] 10.3 Create YouTubeWidget React component
    - Build UI for video grid display
    - Add tabs for "New Releases" and "Recommended"
    - Display video thumbnails, titles, channels, dates
    - Add click handler to open videos
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 10.4 Write property tests for YouTubeWidget
    - **Property 14: YouTube video rendering completeness**
    - **Validates: Requirements 4.3**
    - **Property 15: YouTube video categorization**
    - **Validates: Requirements 4.5**
  
  - [ ]* 10.5 Write unit tests for YouTubeAPIClient
    - Test API response parsing
    - Test error handling
    - Test video type categorization
    - _Requirements: 4.1, 4.2_

- [x] 11. Implement Deals Tracker widget
  - [x] 11.1 Create TechDeal data model
    - Implement TechDeal interface
    - Add price and discount validation
    - Define DealStatus enum
    - _Requirements: 5.3_
  
  - [x] 11.2 Create DealsAPIClient service
    - Implement fetchDeals method
    - Add status filtering (current/upcoming)
    - Integrate with deals API
    - Mock deals API for development
    - _Requirements: 5.1, 5.2_
  
  - [x] 11.3 Create DealsWidget React component
    - Build UI for deals grid display
    - Add tabs for "Current" and "Upcoming" deals
    - Display product name, discount, prices, source, expiration
    - Add click handler to open deal pages
    - Implement daily refresh scheduling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 11.4 Write property tests for DealsWidget
    - **Property 16: Deal rendering completeness**
    - **Validates: Requirements 5.3**
    - **Property 17: Deal status categorization**
    - **Validates: Requirements 5.4**
  
  - [ ]* 11.5 Write unit tests for DealsAPIClient
    - Test API response parsing
    - Test status filtering
    - Test price calculations
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 12. Implement error handling infrastructure
  - [x] 12.1 Create WidgetErrorBoundary component
    - Implement React error boundary
    - Add error logging
    - Create error fallback UI
    - Add retry functionality
    - _Requirements: 8.1_
  
  - [x] 12.2 Create error logging utility
    - Implement error logger with sensitive data redaction
    - Add error categorization
    - Add context capture (widget ID, timestamp)
    - _Requirements: 8.5_
  
  - [x] 12.3 Implement authentication error handling
    - Create auth error UI components
    - Add re-authentication flow
    - Add token expiration detection
    - _Requirements: 8.3, 6.4_
  
  - [ ]* 12.4 Write property tests for error handling
    - **Property 22: Widget error isolation**
    - **Validates: Requirements 8.1**
    - **Property 24: Authentication error handling**
    - **Validates: Requirements 8.3**
    - **Property 25: API fallback behavior**
    - **Validates: Requirements 8.4**
    - **Property 26: Error logging without sensitive data**
    - **Validates: Requirements 8.5**
    - **Property 20: Token expiration handling**
    - **Validates: Requirements 6.4**
  
  - [ ]* 12.5 Write unit tests for error scenarios
    - Test error boundary catching
    - Test sensitive data redaction
    - Test auth error UI
    - _Requirements: 8.1, 8.3, 8.5_

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement Dashboard container and layout
  - [x] 14.1 Create Dashboard main component
    - Implement dashboard container
    - Add widget registration and initialization
    - Implement widget loading states
    - Add global error handling
    - _Requirements: All widgets (1.1, 2.1, 3.1, 4.1, 5.1)_
  
  - [x] 14.2 Implement responsive layout system
    - Create responsive grid layout
    - Add breakpoints for desktop/tablet/mobile
    - Implement widget positioning logic
    - Add CSS media queries
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 14.3 Create widget wrapper component
    - Wrap each widget with error boundary
    - Add loading spinners
    - Add widget headers with refresh buttons
    - Add widget-level error displays
    - _Requirements: 8.1_
  
  - [ ]* 14.4 Write property tests for dashboard
    - **Property 1: Widget data fetching on initialization**
    - **Validates: Requirements 1.1, 3.4, 4.1, 4.2, 5.1, 5.2**
    - **Property 21: Responsive layout adaptation**
    - **Validates: Requirements 7.1, 7.2, 7.3**
  
  - [ ]* 14.5 Write unit tests for dashboard
    - Test widget initialization
    - Test layout rendering at different breakpoints
    - Test widget error isolation
    - _Requirements: 7.1, 7.2, 7.3, 8.1_

- [x] 15. Implement external link handling
  - [x] 15.1 Create link handler utility
    - Implement openInNewTab function
    - Add URL validation
    - Add security attributes (noopener, noreferrer)
    - _Requirements: 1.3, 4.4, 5.5_
  
  - [ ]* 15.2 Write property test for external links
    - **Property 18: External link navigation**
    - **Validates: Requirements 1.3, 4.4, 5.5**

- [x] 16. Integration and final wiring
  - [x] 16.1 Wire all widgets into Dashboard
    - Import and register all widget components
    - Configure widget layout positions
    - Set up widget refresh intervals
    - Add global state management if needed
    - _Requirements: All_
  
  - [x] 16.2 Configure API endpoints and authentication
    - Set up environment variables for API keys
    - Configure OAuth client IDs
    - Set up API base URLs
    - Add development/production environment switching
    - _Requirements: 1.1, 3.1, 3.2, 4.1, 5.1_
  
  - [x] 16.3 Add application styling and polish
    - Apply consistent color scheme
    - Add loading animations
    - Add hover effects and transitions
    - Ensure accessibility (ARIA labels, keyboard navigation)
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 16.4 Write integration tests
    - Test full dashboard initialization
    - Test widget interactions
    - Test error recovery flows
    - Test authentication flows end-to-end
    - _Requirements: All_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Mock external APIs during development to avoid rate limits and costs
- Consider using environment variables for API keys and OAuth credentials
- The implementation uses TypeScript for type safety throughout
