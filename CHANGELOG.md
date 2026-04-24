# FamilyHub Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project will adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for versions v1.0.0 onwards.

## [Unreleased]
### Added
- Initial project setup with documentation and configuration
- Comprehensive implementation plan covering 4 development phases
- Release protocol for version management and deployment
- GitHub Actions CI/CD pipeline structure
- Docker and Docker Compose configuration
- Environment variable template (.env.example)

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- Environment files (.env) excluded from version control
- VAPID and OAuth credentials documented in .env.example with placeholder values

## [v1] - Planned (Q2-Q3 2026)
### Foundation Phase
- FastAPI backend scaffolding
- React + TypeScript frontend setup
- PostgreSQL database initialization
- Docker Compose stack deployment
- Google Calendar OAuth integration
- Wall display component
- Task management system
- PWA support

---

## Release Checklist

Before creating a release, ensure:
- [ ] All tests pass locally
- [ ] Documentation is updated
- [ ] VERSION file is bumped
- [ ] Dockerfiles are updated
- [ ] `.env.example` is current
- [ ] CHANGELOG.md is updated
- [ ] Git commit and tag are created
- [ ] Docker images are built and pushed
- [ ] GitHub release is created

