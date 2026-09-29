# Submission Notes

## What I implemented

- Added unit tests for the task service.
- Added integration tests for all existing API endpoints using Supertest.
- Added edge-case tests for validation, missing tasks, and pagination.
- Found and fixed the pagination off-by-one bug in `getPaginated`.
- Added `PATCH /tasks/:id/assign` with validation and tests.

## Design decisions for `/assign`

- `assignee` must be a string containing at least one non-whitespace character.
- Leading/trailing whitespace is trimmed before storage.
- A missing task returns `404`.
- An already-assigned task returns `409 Conflict` rather than silently overwriting the existing assignee. This avoids changing an assignment accidentally.
- The assigned name is stored as `task.assignee`.

## What I would test next

- Invalid pagination values such as zero, negative, or non-numeric values.
- More combinations of status/priority/due-date validation.
- Repeated completion of an already completed task.
- Concurrent assignment requests if the application later uses a persistent database.

## What surprised me

The pagination implementation used a zero-based array offset with a one-based API page number, which caused page 1 to skip records.

## Questions before production

- Should reassignment be allowed, and if so, who is authorized to perform it?
- What authentication/authorization rules should protect task updates?
- Should task data move from the in-memory store to a persistent database?
- What are the expected pagination limits and behavior for invalid page/limit values?

## Test and Coverage Results

### Test Results

Command:

`npm test`

Result:

- Test Suites: 2 passed, 2 total
- Tests: 32 passed, 32 total

### Coverage

Command:

`npm run coverage`

- Statements: 92.45%
- Branches: 82.02%
- Functions: 93.33%
- Lines: 91.72%
