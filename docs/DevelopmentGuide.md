# BeatBloom Development Guide

## Project Overview
BeatBloom is an AI-powered music generation app that converts hummed audio into complete songs with lyrics and album art. Built with React TypeScript, Google AI services, Supabase, and Replicate.

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure
```
GoogleAI/
├── components/          # UI components
├── services/           # API integrations (Gemini, Replicate, Supabase)
├── assets/            # Static images and icons
├── types.ts           # TypeScript type definitions
└── *.sql             # Supabase schema and policies
```

## Critical Security Requirements

### 🔒 API Key Management
- **NEVER commit API keys to source code**
- Move all hardcoded credentials to environment variables
- Current exposed keys that MUST be secured:
  - Google AI API key in `services/geminiService.ts:5`
  - Replicate token in `services/replicateService.ts:34`
  - Supabase credentials in `services/supabaseService.ts:7-8`

### Client-Side Security
- Avoid direct API calls from browser when possible
- Implement backend proxy for sensitive operations
- Remove CORS proxy dependency (`https://cors.eu.org/`)

## Performance Guidelines

### Audio Handling
- Don't load all song audio blobs in memory simultaneously
- Implement lazy loading for song collections
- Use pagination for large datasets
- Cache API responses appropriately

### Bundle Optimization
- Implement code splitting for components
- Use lazy loading for routes and heavy components
- Optimize asset loading and compression

## Code Quality Standards

### Error Handling
- Provide specific, user-friendly error messages
- Implement proper error boundaries
- Add retry mechanisms for API failures
- Log errors appropriately without exposing sensitive data

### TypeScript Usage
- Use strict type checking
- Avoid `any` types
- Define proper interfaces for all data structures
- Implement type guards for API responses

### Component Architecture
- Keep components focused on single responsibilities
- Extract reusable logic into custom hooks
- Avoid large monolithic components
- Use proper prop drilling or state management

## Development Best Practices

### State Management
- Consider implementing Redux/Zustand for complex state
- Minimize prop drilling
- Use React Query for server state management
- Implement proper loading and error states

### Testing Requirements
- Write unit tests for utility functions
- Test API service integrations
- Implement component testing for critical UI
- Add E2E tests for core user flows

### Accessibility
- Add proper ARIA labels to interactive elements
- Ensure keyboard navigation works
- Test with screen readers
- Implement proper focus management

## User Experience Requirements

### Loading States
- Show progress indicators for long operations (AI generation)
- Provide estimated completion times
- Allow cancellation of long-running operations
- Display meaningful progress messages

### Offline Support
- Implement service worker for offline functionality
- Cache saved songs locally
- Provide offline playback capabilities
- Handle connectivity issues gracefully

### Audio Controls
- Implement proper audio playback controls
- Add waveform visualization and scrubbing
- Support multiple audio formats
- Provide volume and speed controls

## Architecture Guidelines

### API Layer
- Create abstraction layer for external services
- Implement proper request/response interfaces
- Add retry logic and rate limiting
- Handle API versioning appropriately

### Database Design
- Implement proper user authentication
- Add data validation and constraints
- Consider data privacy and GDPR compliance
- Plan for scalability and performance

### Environment Configuration
- Use environment variables for all configuration
- Support multiple environments (dev, staging, prod)
- Implement feature flags for gradual rollouts
- Document all required environment variables

## Deployment Considerations

### Build Process
- Ensure all tests pass before deployment
- Run linting and type checking
- Optimize bundle size and assets
- Implement proper CI/CD pipeline

### Monitoring
- Add application performance monitoring
- Implement error tracking and logging
- Monitor API usage and rate limits
- Track user behavior and app performance

## Feature Development Priorities

### Immediate (Security Critical)
1. Move API keys to backend services
2. Implement proper authentication
3. Remove hardcoded credentials

### High Priority (Performance)
1. Implement lazy loading for audio files
2. Add proper caching mechanisms
3. Optimize bundle size with code splitting

### Medium Priority (UX)
1. Add progress indicators for AI generation
2. Implement comprehensive error handling
3. Add offline support for saved songs

### Long-term (Architecture)
1. Refactor to use state management library
2. Implement proper API abstraction layer
3. Add comprehensive testing suite
4. Build collaboration and sharing features

## Development Workflow
1. Always run `npm run dev` to test locally
2. Check TypeScript compilation with `npm run build`
3. Test critical user flows before committing
4. Ensure no API keys are committed to source
5. Update this guide when making architectural changes

## Notes for AI Assistant
- Always prioritize security when making changes
- Focus on user experience and performance
- Follow existing code patterns and conventions
- Ask for clarification on complex architectural decisions
- Suggest improvements while maintaining backward compatibility