---
id: TASK-3
title: Fix server removal not persisting after refresh
status: In Progress
assignee:
  - '@claude'
created_date: '2026-02-06 12:20'
updated_date: '2026-02-07 09:07'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When toggling off a tool for a server and saving, the server reappears after refresh because it's not being removed from the tool's config file
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Add removeServerFromTool function
- [x] #2 Update editServer to detect removed tools
- [x] #3 Remove server from tool config when tool is toggled off
- [ ] #4 Verify fix works
<!-- AC:END -->
