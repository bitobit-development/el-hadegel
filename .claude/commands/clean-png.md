---
name: clean-png
description: Delete all PNG screenshot files from the .playwright-mcp directory
confirmation: true
---

# Clean Playwright Screenshots

This command removes all PNG files from the `.playwright-mcp` directory that are generated during Playwright testing sessions.

## What it does

1. Lists all PNG files in `.playwright-mcp` directory for review
2. Asks for confirmation before deletion (destructive operation)
3. Deletes all PNG files if confirmed
4. Reports the number of files deleted

## Usage

```
/clean-png
```

## Implementation

The command will:
- Check if `.playwright-mcp` directory exists
- Count and list PNG files found
- Request user confirmation before proceeding
- Delete files using `rm` command
- Provide summary of actions taken

## Safety

- Always shows file count before deletion
- Requires explicit confirmation
- Only targets `.png` files in the specific directory
- Does not delete subdirectories or other file types
