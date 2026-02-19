# Data Model: Fix Frontend E2E Tests

**Branch**: `001-fix-e2e-tests` | **Date**: 2026-02-20

## Overview

This feature involves **no new entities or data model changes**. The feature flag store (`FeatureFlagsStore`), `EnumType`, `BooleanFlag`, `EnumFlag`, and `Project` types are unchanged.

The only source-level change to application code is adding a `data-testid` attribute to the type picker trigger element in `FlagCreateRow`, which has no runtime behavioral impact.

## Stable Entities (Reference)

These entities exist in the store and are relevant to understanding test assertions:

### EnumType

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | crypto.randomUUID() |
| `name` | `string` | Case-insensitive unique |
| `values` | `string[]` | Min 1, case-sensitive unique; `values[0]` is default |

### EnumFlag

| Field | Type | Notes |
|-------|------|-------|
| `type` | `"enum"` | Discriminator |
| `enumTypeId` | `string` | References EnumType.id |
| `value` | `string` | Must be in EnumType.values |

### Initial State (SEED_FLAGS — proj-1)

Tests start with these flags already present in the "Production" project:

| Name | Type | Value |
|------|------|-------|
| `dark-mode` | boolean | true |
| `new-checkout` | boolean | false |

And in "Staging" project:

| Name | Type | Value |
|------|------|-------|
| `beta-dashboard` | boolean | false |

`enumTypes` starts at `[]` — empty.

## Test Data Created Per Test

Each test creates isolated data (fresh page = fresh store per test):

| Test | Enum Type Created | Values | Flags Created |
|------|------------------|--------|---------------|
| T019 | Environment | production, staging, development | MyEnumFlag |
| T020 | Status | active, inactive, pending | StatusFlag1, StatusFlag2 |
| T021 | Tier | gold, silver | TierFlag1, TierFlag2, TierFlag3 |
| T022 | TestType (conditional) | value1 | TestFlag (boolean), TestEnumFlag (enum) |
| T023 | — | — | None persisted |

No name conflicts exist between test-created data and SEED_FLAGS.
