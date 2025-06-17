# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is an Obsidian plugin that scans vault files for tasks with dates and generates iCal calendar files. The plugin supports multiple storage destinations (GitHub Gist, local files, web API) and can generate both VEVENT and VTODO calendar entries.

## Development Commands

### Build and Development
- `bun dev` - Development build with watch mode using esbuild
- `bun build` - Production build (includes TypeScript type checking)
- `bun test` - Run Jest tests (currently no tests exist)

### Version Management
- `bun version` - Bump version and update manifest files
- Uses `version-bump.mjs` script which updates both `manifest.json` and `versions.json`

### Code Quality
- ESLint configured with TypeScript rules
- 2-space indentation, single quotes, semicolons required
- Run `npx eslint src/` to check code style

## Architecture Overview

### Core Processing Flow
1. **ObsidianIcalPlugin.ts** - Main plugin entry point, manages lifecycle and settings
2. **Main.ts** - Orchestrates the scanning and processing pipeline
3. **TaskFinder.ts** - Discovers and parses tasks from Markdown files using Obsidian's metadata cache
4. **IcalService.ts** - Converts tasks to iCal format (VEVENT/VTODO)
5. **Storage Clients** - Save calendars to various destinations

### Key Components
- **Task Models**: `Task.ts`, `TaskDate.ts`, `TaskStatus.ts` handle task representation
- **Settings System**: `Settings.ts`, `SettingsManager.ts`, `SettingTab.ts` manage configuration
- **Storage Clients**: `GithubClient.ts`, `FileClient.ts`, `ApiClient.ts` handle different save destinations
- **API Integration**: `ApiClient.ts` with `ValidationCache.ts` for web API validation

### Plugin Integration
- Uses Obsidian's metadata cache for efficient file parsing
- Integrates with Obsidian's settings API for configuration UI
- Supports Day Planner plugin format for enhanced task discovery
- Handles Obsidian's internal link format in calendar descriptions

### Build System
- esbuild for fast bundling with TypeScript compilation
- Entry point: `src/ObsidianIcalPlugin.ts`
- Output: `build/main.js` with accompanying `manifest.json`
- Development builds include source maps and watch functionality

## Testing
The project has Jest configured but no test files currently exist. When adding tests, create them in a `__tests__` directory or with `.test.ts` suffix.

## Key Features to Understand
- **Multi-format Support**: Can generate both calendar events and TODO items
- **Flexible Date Processing**: Handles start/due/scheduled dates with user preferences
- **Tag Filtering**: Include/exclude tasks based on tags
- **Multiple Storage Options**: GitHub Gist, local files, and web API endpoints
- **Periodic Scanning**: Automatic vault updates at configurable intervals