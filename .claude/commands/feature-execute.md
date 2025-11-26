---
name: feature-execute
description: Execute feature documentation from MD file path
confirmation: true
allowed-tools:
  - Read
  - Glob
  - TodoWrite
  - Task
argument-hint: path/to/feature.md (e.g., docs/features/place-online-order.md)
---

# /feature-execute - Execute Feature Documentation

Reads and executes feature documentation from an MD file path. **ALWAYS** delegates to Rotem strategy agent for orchestration, task breakdown, and quality assurance.

## Usage

```bash
/feature-execute docs/features/place-online-order.md    # Execute feature from MD file
/feature-execute                                         # List available features
```

## What it does

1. **🎯 Strategic Orchestration (Rotem Agent)**
   - **ALWAYS** starts with Task tool invoking rotem-strategy agent
   - Delegates entire feature execution to Rotem for orchestration
   - Rotem manages task breakdown, agent coordination, and quality gates

2. **📂 Locate & Parse Feature (via Rotem)**
   - Searches `docs/features/` directory
   - Validates feature file exists
   - Reads feature specification
   - Extracts requirements and acceptance criteria

3. **📋 Task Planning (via Rotem)**
   - **MANDATORY**: Creates comprehensive TodoWrite task list
   - Breaks down into granular, trackable tasks
   - Identifies required specialized agents
   - Sets up quality validation checkpoints

4. **🚀 Coordinated Execution (via Rotem)**
   - Delegates to specialized agents (Adi, Oren, Tal, Gal, etc.)
   - **STRICT**: Maintains exactly ONE task as `in_progress`
   - **IMMEDIATE**: Marks task `completed` right after finishing
   - Enforces sequential execution with todo tracking

5. **✅ Quality Assurance (via Rotem)**
   - Uri agent for testing (mandatory)
   - Maya agent for code review (mandatory)
   - Verifies all acceptance criteria met
   - Confirms 100% of todos completed

## Implementation

**CRITICAL**: This command **ALWAYS** starts by invoking the rotem-strategy agent via Task tool. Rotem orchestrates the entire feature execution workflow.

### Step 1: Immediate Delegation to Rotem Agent

**MANDATORY FIRST ACTION:**
```
Use Task tool to invoke rotem-strategy agent with this prompt:

"Execute feature from $ARGUMENTS

CRITICAL REQUIREMENTS:
1. **TodoWrite is MANDATORY**: Create comprehensive task list before any implementation
2. **Strict Todo Discipline**:
   - Exactly ONE task as 'in_progress' at any time (never zero, never multiple)
   - Mark task 'completed' IMMEDIATELY after finishing (no batching)
   - Update next task to 'in_progress' before starting work
3. **Quality Gates**:
   - Uri agent testing is mandatory (80%+ coverage)
   - Maya agent code review is mandatory
   - All acceptance criteria must be verified
4. **Agent Coordination**: Delegate to specialized agents as needed
5. **Final Report**: Confirm all todos completed (100%)

Feature file: $ARGUMENTS

Your responsibilities:
- Read and parse the feature documentation from the provided MD file path
- Create granular TodoWrite task list (10-20 tasks)
- Coordinate specialized agents (Adi, Oren, Tal, Gal, Uri, Maya)
- Enforce strict todo tracking throughout
- Ensure quality gates are met
- Provide comprehensive completion report"
```

**If no $ARGUMENTS provided:**
- Do NOT invoke Rotem agent
- Use Glob to find all files: `docs/features/*.md`
- Display numbered list of available features with full paths
- Exit with helpful message

**If feature file doesn't exist:**
- Do NOT invoke Rotem agent
- Check if file path is valid using Read tool
- List available features using Glob
- Exit with error message

### Step 2: Rotem Agent Workflow

Once invoked, Rotem agent will execute these steps:

#### 2.1 Parse Feature Documentation
- Read feature file from provided path: `$ARGUMENTS`
- Extract all sections:
  - Title/Name (H1 heading)
  - Description
  - User Stories
  - Functional Requirements
  - Technical Requirements
  - Acceptance Criteria
  - Implementation Steps
  - Technical Notes
  - Testing Requirements

#### 2.2 Create Comprehensive Task List (TodoWrite)
**MANDATORY BEFORE ANY IMPLEMENTATION:**
- Break down implementation into 10-20 granular tasks
- Include these mandatory tasks:
  - Parse feature documentation
  - Analyze technical requirements
  - Identify agent assignments
  - [Implementation tasks from feature doc]
  - Run test suite (Uri agent)
  - Code review (Maya agent)
  - Verify acceptance criteria
  - Generate completion report
- Set all tasks to `pending` status
- Display task list for visibility

#### 2.3 Agent Assignment & Coordination
Rotem identifies and delegates to specialized agents:
- **Tal (tal-design)** - UI components, responsive design, accessibility
- **Oren (oren-backend)** - APIs, performance, security
- **Gal (gal-database)** - Schema design, migrations, queries
- **Adi (adi-fullstack)** - Complete features (UI + backend)
- **Uri (uri-testing)** - TDD, Jest tests, coverage analysis
- **Maya (maya-code-review)** - Code quality, security, best practices

#### 2.4 Sequential Task Execution
**STRICT TODO DISCIPLINE:**
1. Mark first task as `in_progress`
2. Execute task (directly or via agent delegation)
3. **IMMEDIATELY** mark as `completed` upon finish
4. Mark next task as `in_progress`
5. Repeat until all tasks done

**NEVER:**
- Have zero tasks `in_progress` (must always have one)
- Have multiple tasks `in_progress` (exactly one only)
- Batch complete multiple tasks (complete immediately)
- Skip todo updates (update after every task)

#### 2.5 Quality Assurance Gates

**Testing Phase (Uri Agent):**
- Mark "Run test suite" task as `in_progress`
- Invoke Uri agent with feature context
- Ensure 80%+ code coverage
- Verify all tests pass
- Mark task as `completed`

**Code Review Phase (Maya Agent):**
- Mark "Code review" task as `in_progress`
- Invoke Maya agent with implementation details
- Review for:
  - Code quality and best practices
  - Security vulnerabilities
  - Performance optimization
  - TypeScript safety
  - Accessibility compliance
- Address any issues raised
- Mark task as `completed`

#### 2.6 Acceptance Criteria Verification
- Mark "Verify acceptance criteria" task as `in_progress`
- Review each criterion from feature doc
- Confirm all criteria met
- If any missing:
  - Add new tasks to TodoWrite
  - Implement missing requirements
  - Re-verify criteria
- Mark task as `completed`

#### 2.7 Completion Report
- Mark "Generate completion report" task as `in_progress`
- Generate comprehensive summary:
  - Feature name and description
  - Total tasks completed (must be 100%)
  - Files modified/created (with counts)
  - Test results (coverage %, pass/fail)
  - Code review outcome
  - Acceptance criteria status (all met)
  - Next steps (manual testing, deployment)
- Mark task as `completed`
- Display report to user

### Step 3: Command Completion

After Rotem agent completes:
- Verify all todos marked as `completed`
- Confirm quality gates passed (Uri + Maya)
- Display Rotem's completion report
- Command finishes successfully

## Feature Document Structure

Expected markdown structure for feature files:

```markdown
# Feature Name

Brief description of the feature.

## User Stories

- As a [role], I want [goal] so that [benefit]

## Requirements

### Functional Requirements
- Requirement 1
- Requirement 2

### Technical Requirements
- Tech requirement 1
- Tech requirement 2

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Implementation Steps

1. Step 1 description
2. Step 2 description
3. Step 3 description

## Technical Notes

- Architecture considerations
- Dependencies required
- API endpoints needed

## Testing Requirements

- Test scenario 1
- Test scenario 2
- Coverage expectations
```

## Safety Features

- ✅ **ALWAYS starts with Rotem agent** for orchestration
- ✅ **TodoWrite is mandatory** before any implementation
- ✅ **Strict todo discipline**: Exactly ONE task `in_progress` at all times
- ✅ **Immediate completion**: Mark tasks done right after finishing
- ✅ **Quality gates enforced**: Uri testing + Maya code review mandatory
- ✅ **100% completion required**: All todos must be completed
- ✅ **Acceptance criteria verification**: Every criterion validated
- ✅ **Specialized agent coordination**: Right agent for each task
- ✅ **Comprehensive reporting**: Full summary of work completed
- ✅ **Validates feature file exists** before Rotem invocation

## Examples

### Execute feature from MD file
```bash
/feature-execute docs/features/place-online-order.md

# Workflow:
# 1. Validates docs/features/place-online-order.md exists
# 2. Invokes rotem-strategy agent immediately with file path
# 3. Rotem reads and parses the MD file
# 4. Rotem creates comprehensive TodoWrite task list (10-20 tasks)
# 5. Rotem coordinates specialized agents (Adi, Tal, Oren, etc.)
# 6. Strict todo tracking: ONE task in_progress, immediate completion
# 7. Uri agent runs tests (80%+ coverage required)
# 8. Maya agent reviews code (quality/security/performance)
# 9. Verifies all acceptance criteria met
# 10. Rotem provides completion report (100% todos done)
```

### List available features
```bash
/feature-execute

# Output:
# Available features in docs/features/:
# 1. docs/features/place-online-order.md
# 2. docs/features/member-dashboard.md
# 3. docs/features/inventory-management.md
#
# Usage: /feature-execute <path/to/feature.md>
```

## Troubleshooting

### Feature file not found
- Check file path is correct and file exists
- Verify file path is absolute or relative to project root
- Use `/feature-execute` with no args to see available features in docs/features/

### Implementation fails
- Review error message
- Check if prerequisites met (dependencies installed)
- Verify database connection (.env.local)
- Run `npm install` if packages missing

### Tests fail
- Review test output
- Uri agent will provide detailed error info
- Fix issues and re-run: `npm test`
- Update feature doc if requirements changed

### Code review issues
- Maya agent will identify problems
- Address concerns raised
- Re-run review after fixes
- Consider architectural changes if needed

## Agent Coordination

The command intelligently delegates to agents:

| Task Type | Primary Agent | Fallback |
|-----------|--------------|----------|
| UI Components | Tal | Adi |
| API Endpoints | Oren | Adi |
| Database Schema | Gal | Adi |
| Full Feature | Adi | Rotem |
| Complex Multi-step | Rotem | Direct |
| Testing | Uri | Direct |
| Code Review | Maya | Direct |
| Documentation | Yael | Direct |

## Notes

- Always creates task plan before implementation
- Maintains exactly ONE task as `in_progress` at a time
- Completes tasks immediately (no batching)
- Testing and code review are mandatory
- Uses specialized agents for quality assurance
- Follows project conventions (CLAUDE.md)
- Respects allowed-tools constraints
