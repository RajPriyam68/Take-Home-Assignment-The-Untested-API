# Bug Report

## Bug: First pagination page skipped the first `limit` tasks

### Location
`src/services/taskService.js` — `getPaginated(page, limit)`

### Expected behavior
The API documents pagination as `page=1&limit=10`, so page 1 should return the first 10 tasks.

### Actual behavior
The implementation calculated the offset as:

```js
const offset = page * limit;
```

For `page=1&limit=2`, this starts at index 2 and skips the first two tasks. Page 1 therefore returned the third task onward.

### How I discovered it
I wrote a test for the first pagination page:

```js
expect(taskService.getPaginated(1, 2)).toEqual(firstTwoTasks);
```

The test failed against the original implementation because the returned slice started at index 2.

### Why this is a bug
The API uses 1-based page numbers. Array indexes are 0-based. The first page must therefore start at `(page - 1) * limit`, not `page * limit`.

### Fix
Changed the offset calculation to:

```js
const offset = (page - 1) * limit;
```

This makes page 1 start at index 0 and page 2 start at index `limit`.
