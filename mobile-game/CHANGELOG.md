# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Being management screen
- Crisis detail view
- Being fusion interface
- Integrated book reader
- Push notifications
- Community features
- AR mode
- Multiplayer events

---

## [1.0.0] - 2024-12-13

### Added
- **Core Game Loop**
  - GPS-based map exploration
  - Fractal collection system (5 types)
  - Crisis deployment mechanics
  - Being system with 15 attributes
  - Experience and leveling (1-50)
  - Resource management (Energy, Consciousness)

- **Map Features**
  - Interactive Google Maps integration
  - Real-time GPS tracking
  - Fractal spawn generation (procedural, 2km radius)
  - Fractal activation (50m proximity)
  - Animated markers with pulse effect
  - Dark mode map style
  - Detection radius visualization
  - User location centering

- **API & Sync**
  - Mobile Bridge API (read-only)
  - Health check endpoint
  - Get beings endpoint
  - Get reading progress endpoint
  - Get microsocieties endpoint
  - Get books catalog endpoint
  - Supabase integration support
  - Local fallback storage
  - Sync service (web → mobile)
  - Conflict detection
  - Timestamp-based sync

- **Data Layer**
  - PostgreSQL database schema (9 tables)
  - SQLite compatibility
  - AsyncStorage integration
  - State persistence
  - Zustand global store
  - Mobile-prefixed tables (isolation)

- **UI/UX**
  - Resource HUD (energy, consciousness, level)
  - Being count indicator
  - Map controls (center, zoom)
  - Pull-to-refresh
  - Loading states
  - Error handling
  - Success animations

- **Configuration**
  - Environment-based API URLs
  - Game constants (resources, levels, attributes)
  - Fractal type definitions
  - Crisis type definitions
  - Map configuration
  - Color themes

- **Documentation**
  - README.md with setup instructions
  - ARCHITECTURE.md with system design
  - API-REFERENCE.md with all endpoints
  - GAME-DESIGN.md with mechanics
  - DEVELOPER-GUIDE.md
  - USER-MANUAL.md
  - CONTRIBUTING.md
  - SECURITY.md
  - ROADMAP.md
  - This CHANGELOG.md

- **Developer Tools**
  - ESLint configuration
  - Prettier formatting
  - Jest testing setup
  - Git hooks (planned)
  - TypeScript support (planned)

### Security
- Read-only API prevents data corruption
- UUID validation on all API calls
- HTTPS-only communication
- SQL injection prevention
- XSS protection
- Rate limiting (planned for v1.1)
- Input sanitization

### Performance
- Optimized map rendering
- Throttled GPS updates (10s intervals)
- AsyncStorage caching
- Lazy loading (planned)
- Image optimization (planned)

---

## [0.9.0] - 2024-12-10 (Beta)

### Added
- Beta testing release
- Core map functionality
- Basic being system
- API scaffolding

### Changed
- Migrated from Redux to Zustand
- Updated React Native to 0.73.2

### Fixed
- GPS permission handling on Android 13+
- Map crash on iOS when location unavailable
- Sync infinite loop bug

---

## [0.5.0] - 2024-12-05 (Alpha)

### Added
- Initial project setup
- React Native base configuration
- Basic navigation structure
- Placeholder screens

### Changed
- N/A (first release)

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- Initial security review completed

---

## Version History Summary

| Version | Date | Type | Highlights |
|---------|------|------|------------|
| **1.0.0** | 2024-12-13 | Major | First production release, full MVP |
| 0.9.0 | 2024-12-10 | Beta | Beta testing, core features |
| 0.5.0 | 2024-12-05 | Alpha | Initial setup |

---

## Upgrade Guide

### From 0.9.0 to 1.0.0

**Breaking Changes:**
- None (first major release)

**Migration Steps:**
1. Update app from store
2. First launch will trigger data migration
3. Sync with web account to restore beings
4. Review new features tutorial

**Data Migration:**
- All AsyncStorage data preserved
- New schema fields added automatically
- No user action required

---

## Roadmap

### v1.1.0 (Planned: January 2025)
- Being management screen
- Crisis detail view
- Mission timer UI
- Rate limiting implementation
- Performance optimizations

### v1.2.0 (Planned: February 2025)
- Being fusion feature
- Training system
- Push notifications
- Community features

### v2.0.0 (Planned: Q2 2025)
- Integrated book reader
- AR mode (experimental)
- Multiplayer events
- Achievement system
- Leaderboards

See [ROADMAP.md](docs/ROADMAP.md) for full details.

---

## Contributors

Thank you to all contributors who made this release possible:

- **Development Team**: Core features, API, database
- **Design Team**: UI/UX, assets, animations
- **QA Team**: Testing, bug reports
- **Community**: Beta testers, feedback

Full contributors list: [CONTRIBUTORS.md](CONTRIBUTORS.md)

---

## Release Notes

### v1.0.0 Release Notes

**Release Date:** December 13, 2024

**Highlights:**
- 🎮 First playable version with complete core loop
- 🗺️ Fully functional GPS map with fractal collection
- 🧬 Being system with 15 attributes
- 🔄 Web account sync (read-only)
- 📱 Available on Android (iOS coming soon)

**Known Issues:**
- iOS build pending App Store review
- Map occasionally lags on older devices (Android 8)
- Sync can be slow on poor connections
- Some translations incomplete (Spanish in progress)

**Download:**
- Android APK: [Download](https://github.com/releases/v1.0.0)
- Google Play: [Link](https://play.google.com)
- iOS TestFlight: [Link](https://testflight.apple.com) (beta)

**Requirements:**
- Android 8.0+ or iOS 13.0+
- 200MB free storage
- GPS/Location services
- Internet connection (for sync and live features)

**Support:**
- Email: support@awakeningprotocol.com
- Discord: [discord.gg/awakening](https://discord.gg)
- Docs: [docs.awakeningprotocol.com](https://docs.example.com)

---

**Last Updated:** 2025-12-13
**Current Version:** 1.0.0
**Latest Release:** [View on GitHub](https://github.com/awakening-protocol/mobile-game/releases)
