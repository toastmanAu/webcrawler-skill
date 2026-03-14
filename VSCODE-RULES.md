# VS Code Extension Rules - Self-Service Coding Framework

## Goal
Use VS Code extensions to code more efficiently without asking permission. Streamline development tasks.

## When to Use Copilot/Codeium
- **Boilerplate code:** Use Copilot Chat for scaffolding (React components, API routes, etc.)
- **Auto-complete:** Trust Codeium for function bodies and variable names
- **Code review:** Use for obvious style issues before committing
- **Documentation:** Generate docstrings, README sections

## When to Avoid AI Assistance
- **Security-critical code:** Crypto, auth, DB queries → manual review required
- **Architecture decisions:** Complex multi-file refactoring → reasoning time
- **Algorithm design:** Novel implementations → think first, then code
- **Performance-sensitive:** Low-level optimizations → profile before optimizing

## Language-Specific Rules

### Python (PyLance + Python extension)
- **Use type hints:** Trust Pylance to catch type errors
- **Linting:** ESLint via extension before commits
- **Testing:** Auto-generate test stubs with Copilot, then fill in assertions

### Go (golang extension)
- **Format:** gofmt automatically via VS Code on save
- **Build:** Use extension's "Run" button for fast iteration
- **Struct generation:** Copilot for boilerplate, verify manually

### Rust (rust-analyzer)
- **Borrow checker:** Trust rust-analyzer's suggestions
- **Traits:** Use Copilot for impl boilerplate
- **Testing:** Cargo test via integrated terminal

### JavaScript/TypeScript (ESLint + Prettier)
- **Format:** Auto-format on save (Prettier)
- **Linting:** Trust ESLint suggestions, auto-fix where safe
- **Comments:** Use Better Comments for visual organization

### C++ (cpptools)
- **Debugging:** Use integrated debugger for stepping through
- **IntelliSense:** Trust for standard library suggestions
- **Build:** Configure CMake/Make in terminal

## Workflow Rules

### 1. File Read & Analysis
```
When starting a coding task:
1. Use Continue.dev to read entire project structure
2. Ask Copilot Chat: "Explain the architecture of [file]"
3. Check for similar patterns in codebase before implementing
```

### 2. Implementation
```
For new features:
1. Write function signature first (manual or Copilot-suggested)
2. Use Codeium for implementation details
3. Run tests immediately (Cargo test, npm test, etc.)
4. Trust lint errors → auto-fix with ESLint
5. Manual code review for logic correctness
```

### 3. Debugging
```
When tests fail:
1. Use integrated debugger (F5 to start)
2. Set breakpoints at failure points
3. Inspect variables in Debug Console
4. Use Copilot Chat to explain error → ask for fix suggestions
5. Verify fix doesn't break other tests
```

### 4. Refactoring
```
Before refactoring:
1. Run full test suite → document baseline
2. Use GitLens to understand history of the code
3. Ask Copilot: "Refactor this function for clarity"
4. Apply changes incrementally
5. Re-run tests after each change
```

### 5. Documentation
```
For docs/comments:
1. Use Better Comments for visual clarity (// !, // ?, // TODO)
2. Use Copilot to generate docstrings/README sections
3. Manual review for accuracy (AI can hallucinate)
4. Validate with actual code behavior
```

## Cost Control (Using Copilot wisely)
- **GitHub Copilot Chat:** Limited free usage → use for high-value decisions
- **Codeium:** Free tier → use for auto-complete and basic suggestions
- **Continue.dev:** Local reasoning → use for understanding code before Copilot

## Rules for Each Tool

### Copilot Chat (For Architecture & Complex Logic)
✅ **Use for:**
- Explaining complex code sections
- Suggesting refactoring approaches
- Generating test cases
- Writing documentation

❌ **Don't use for:**
- Every single function (too many calls)
- Security decisions without verification
- Performance tuning without benchmarking

### Codeium (For Autocomplete & Snippets)
✅ **Use for:**
- Function body completion
- Loop/conditional boilerplate
- Import statements
- Variable naming suggestions

❌ **Don't use for:**
- SQL queries (verify manually)
- Regex patterns (test first)
- Error handling (be explicit)

### Continue.dev (For Project Navigation)
✅ **Use for:**
- Understanding new codebases
- Finding similar patterns
- Generating test boilerplate
- Refactoring suggestions

❌ **Don't use for:**
- Mission-critical decisions (reason yourself)

### GitLens (For History & Context)
✅ **Always use for:**
- Understanding why code was written
- Checking commit history before modifying
- Blaming lines before changing them
- Following author intent

### Prettier + ESLint (Automated Formatting)
✅ **Trust completely:**
- Auto-format on save
- Auto-fix linting issues (non-style)
- Format before commits

## Task Types & Tool Combinations

### Task: Add New Feature
```
1. Read requirements with Continue → understand scope
2. Check existing patterns with GitLens
3. Copilot Chat → architecture review
4. Codeium → write implementation
5. ESLint → auto-fix style
6. Integrated terminal → run tests
7. Copilot Chat → code review
8. Commit with GitHistory context
```

### Task: Fix Bug
```
1. Integrated Debugger → reproduce bug
2. GitLens → understand code history
3. Copilot Chat → suggest fix
4. Codeium → implement fix
5. Run tests → verify fix
6. Check for regressions
```

### Task: Refactor Code
```
1. GitLens → understand current design
2. Copilot Chat → refactoring suggestions
3. Continue → read related files
4. Codeium → implement changes
5. Run full test suite → ensure no breakage
6. Document changes
```

### Task: Code Review (My Own)
```
1. ESLint → style issues
2. PyLance/rust-analyzer → type safety
3. Copilot Chat → logic review
4. GitHistory → ensure intent matches
5. Manual testing → edge cases
```

## When to Stop Using AI & Think

- **Security:** Crypto, auth, SQL injection risks → reason yourself
- **Performance:** Before optimizing, profile with debugger
- **Architecture:** Major refactoring → design on paper first
- **Novel algorithms:** Research → prototype → optimize
- **Edge cases:** AI suggestions often miss edge cases → test thoroughly

## Success Metrics

- ✅ Boilerplate code written 3x faster (Copilot)
- ✅ Bugs caught before commit (ESLint, type hints)
- ✅ Code reviews faster (GitLens context)
- ✅ Tests pass on first run (proper tool usage)
- ✅ Zero security issues (manual review on sensitive code)

## Emergency Rules

If something feels wrong:
1. **Stop and think** — don't blindly trust AI suggestions
2. **Test immediately** — don't assume it works
3. **Manual review** — especially for user-facing code
4. **Ask for help** — use Copilot Chat to explain, verify with reasoning

---

**Implementation:** These rules are active immediately. Use VS Code for all coding tasks with these guidelines. Trust the tools, verify critical code.
---

## Active Extensions (Post-Installation - 2026-03-14)

### Installed & Ready
- **ErrorLens** (usernamehw.errorlens) — Shows JavaScript/TypeScript errors inline ✅
- **REST Client** (humao.rest-client) — Test WebSocket/HTTP without curl ✅
- **GitLens** (eamodio.gitlens) — Time-travel through commits, blame tracking ✅
- **Spell Checker** (streetsidesoftware.code-spell-checker) — Catch typos in code ✅
- **Indent Rainbow** (oderwat.indent-rainbow) — Visual indent levels ✅
- **Markdown Linter** (davidanson.vscode-markdownlint) — Validate markdown docs ✅
- **VS Code Icons** (vscode-icons-team.vscode-icons) — Better file type icons ✅
- **Thunder Client** (rangav.vscode-thunder-client) — HTTP testing UI ✅
- **Prettier** (esbenp.prettier-vscode) — Auto-format JavaScript/JSON ✅
- **ESLint** (dbaeumer.vscode-eslint) — Lint JavaScript/TypeScript ✅
- **Copilot Chat** (github.copilot-chat) — AI-assisted boilerplate ✅
- **Codeium** (codeium.codeium) — Free AI autocomplete ✅
- **Continue** (continue.continue) — Local AI coding assistant ✅

### Recommended for FiberQuest Development
1. **ErrorLens** — Use for real-time validation of final-server.js
2. **REST Client** — Test WebSocket messages in .http files
3. **Thunder Client** — Debug UDP commands before running
4. **GitLens** — Track which changes broke/fixed validation logic
5. **Markdown Linter** — Keep documentation clean

### Quick Tips
- ErrorLens: Hover over red squigglies for full error details
- REST Client: Create `test.http` files with WebSocket test cases
- Thunder Client: UI tab in sidebar for building requests
- GitLens: Right-click file → View File History to see all changes
- Spell Checker: Catches typos in comments + strings

