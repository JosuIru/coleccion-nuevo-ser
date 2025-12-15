# Contributing to Awakening Protocol

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Age, body size, disability, ethnicity, gender identity and expression
- Level of experience, nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Positive behaviors:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other contributors

**Unacceptable behaviors:**
- Trolling, insulting/derogatory comments, personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Violations can be reported to: conduct@awakeningprotocol.com

---

## How to Contribute

### Types of Contributions

1. **Bug Reports**: Found a bug? Report it!
2. **Feature Requests**: Have an idea? Share it!
3. **Code**: Fix bugs or implement features
4. **Documentation**: Improve guides, add examples
5. **Design**: UI/UX improvements, assets
6. **Testing**: Write tests, test new features

### Before You Start

- Check existing issues/PRs to avoid duplicates
- For major changes, open an issue first to discuss
- Read our [Developer Guide](DEVELOPER-GUIDE.md)
- Set up your development environment

---

## Development Process

### 1. Fork & Clone

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/YOUR_USERNAME/mobile-game.git
cd mobile-game

# Add upstream remote
git remote add upstream https://github.com/awakening-protocol/mobile-game.git
```

### 2. Create a Branch

```bash
# Update your fork
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name
```

**Branch naming:**
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Urgent fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### 3. Make Changes

- Follow our [coding standards](#coding-standards)
- Write tests for new code
- Update documentation as needed
- Commit frequently with clear messages

### 4. Test Thoroughly

```bash
# Run linter
npm run lint

# Run tests
npm test

# Test on device/emulator
npm run android
npm run ios
```

### 5. Submit Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create PR on GitHub:
# feature/your-feature-name → upstream/develop
```

---

## Coding Standards

### JavaScript Style

**File Naming:**
- Components: `PascalCase.js`
- Services: `camelCase.js`
- Constants: `UPPER_SNAKE_CASE`

**Code Style:**
```javascript
// Use descriptive names
const calculateSuccessProbability = (being, crisis) => {
  // Clear logic
  const matchScore = calculateAttributeMatch(being, crisis);
  return clamp(matchScore, 0, 100);
};

// Avoid magic numbers
const MAX_ENERGY = 100;
const ENERGY_REGEN_RATE = 1;

// Document complex functions
/**
 * Calculate distance between two GPS coordinates
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Haversine formula implementation
};
```

### React Native Best Practices

```javascript
// ✅ DO: Use functional components with hooks
const BeingCard = ({ being, onPress }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{being.name}</Text>
    </TouchableOpacity>
  );
};

// ❌ DON'T: Use class components (unless necessary)
class BeingCard extends React.Component {
  // Old style
}
```

### Testing

Every new feature must include tests:

```javascript
// Component tests
describe('BeingCard', () => {
  it('renders being name', () => {
    const { getByText } = render(<BeingCard being={mockBeing} />);
    expect(getByText('Test Being')).toBeTruthy();
  });
});

// Service tests
describe('SyncService', () => {
  it('syncs beings successfully', async () => {
    const result = await SyncService.syncFromWeb(userId);
    expect(result.success).toBe(true);
  });
});
```

---

## Pull Request Process

### PR Checklist

Before submitting, ensure:

- [ ] Code follows style guidelines (runs `npm run lint` without errors)
- [ ] All tests pass (`npm test`)
- [ ] New code has tests (aim for >80% coverage)
- [ ] Documentation updated (if needed)
- [ ] No console.log/debugging code left
- [ ] Commits follow [conventional format](#commit-messages)
- [ ] PR description explains changes clearly

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How to Test
1. Step 1
2. Step 2
3. Expected result

## Screenshots (if UI changes)
[Add screenshots]

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Lint passes
- [ ] Tested on Android
- [ ] Tested on iOS
```

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding/updating tests
- `chore`: Maintenance

**Examples:**
```
feat(map): add fractal collection animation

fix(sync): prevent duplicate being creation
Closes #123

docs(api): add endpoint usage examples

refactor(store): migrate from Redux to Zustand
BREAKING CHANGE: Redux removed, update imports
```

### Code Review Process

1. **Automated Checks**: CI runs linter, tests, build
2. **Peer Review**: At least 1 maintainer approval required
3. **Changes Requested**: Address feedback, push updates
4. **Approval**: Once approved, maintainer merges
5. **Merge**: Squash merge to `develop` branch

**Review Timeline:**
- Small fixes: 1-2 days
- Features: 3-5 days
- Major changes: 1-2 weeks

---

## Issue Reporting

### Bug Reports

Use this template:

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Device: iPhone 14 / Samsung Galaxy S21
- OS: iOS 16 / Android 13
- App Version: 1.0.0

## Screenshots
[Add if helpful]

## Additional Context
Any other relevant info
```

### Feature Requests

Use this template:

```markdown
## Feature Description
What feature do you want?

## Use Case
Why is this feature valuable?

## Proposed Solution
How would it work? (optional)

## Alternatives Considered
Other approaches you've thought of

## Additional Context
Mockups, examples, etc.
```

---

## Development Guidelines

### Adding a New Feature

1. **Discuss**: Open issue to discuss approach
2. **Design**: Plan architecture, API changes
3. **Implement**: Write code following standards
4. **Test**: Write unit and integration tests
5. **Document**: Update docs, add examples
6. **Submit**: Create PR with clear description

### Fixing a Bug

1. **Reproduce**: Confirm you can reproduce the bug
2. **Identify**: Find root cause
3. **Fix**: Implement minimal fix
4. **Test**: Add test to prevent regression
5. **Document**: Update CHANGELOG.md
6. **Submit**: PR with "Fixes #issue-number"

### Refactoring

1. **Justify**: Explain why refactoring is needed
2. **Plan**: List affected files/modules
3. **Test First**: Ensure good test coverage
4. **Refactor**: Make changes incrementally
5. **Verify**: All tests still pass
6. **Document**: Update architecture docs if needed

---

## Communication

### Where to Ask Questions

- **GitHub Discussions**: General questions, ideas
- **GitHub Issues**: Bug reports, feature requests
- **Discord**: Real-time chat, community support
- **Email**: security@awakeningprotocol.com (security issues only)

### Getting Help

**Stuck on something?**
1. Check documentation (README, guides)
2. Search existing issues
3. Ask in Discord #development channel
4. Create GitHub Discussion

**Response times:**
- Discord: Usually < 24 hours
- GitHub: 2-3 days
- Complex questions: Up to 1 week

---

## Recognition

### Contributors

All contributors are listed in:
- `CONTRIBUTORS.md` file
- GitHub contributors page
- In-app credits (major contributors)

### Attribution

We follow the [All Contributors](https://allcontributors.org/) specification:

- 💻 Code
- 📖 Documentation
- 🐛 Bug reports
- 💡 Ideas
- 🎨 Design
- ✅ Tests
- 🌍 Translation

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

## Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort! 🙏

---

**Questions?** Open a GitHub Discussion or ask in Discord!

**Last Updated:** 2025-12-13
