# Supabase → CockroachDB Migration Plan

**Status**: In Progress  
**Target Database**: CockroachDB (AWS ap-south-1 - India)  
**Timeline**: Phase-based approach

## Overview
- **26 Tables** to migrate
- **22 SQL Migrations** to recreate
- **343+ Database Queries** to update
- **8 RPC Functions** to replace
- **Supabase Auth** to replace with alternative
- **Real-time Subscriptions** to handle

---

## Phase 1: Infrastructure Setup ✅
- [x] CockroachDB cluster created
- [x] Connection credentials obtained
- [ ] Certificate downloaded
- [ ] Connection tested

**Status**: Awaiting certificate setup

---

## Phase 2: Database Schema Migration
- [ ] Create all 26 tables in CockroachDB
- [ ] Migrate RPC functions (8 total)
- [ ] Migrate trigger functions (5 total)
- [ ] Export and import data from Supabase (if needed)

**Estimated Time**: 2-3 hours

---

## Phase 3: Application Code Migration
- [ ] Replace Supabase client with `pg` (node-postgres)
- [ ] Update 29 API routes
- [ ] Update authentication system
- [ ] Replace real-time subscriptions
- [ ] Update environment variables

**Estimated Time**: 4-6 hours

---

## Phase 4: Testing & Verification
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual feature testing
- [ ] Performance validation

**Estimated Time**: 2-3 hours

---

## Authentication Strategy
**Decision Needed**: Choose from:
1. **Custom JWT + Sessions** (Simplest for now)
2. **Auth0** (Managed, recommended)
3. **SuperTokens** (Self-hosted, open-source)

For now: **Custom JWT + Database Sessions** (minimal changes)

---

## Real-time Strategy
**Current**: Supabase real-time on `messages` and `conversations`  
**Options**:
1. **Polling** (simple, HTTP-based)
2. **WebSockets with custom server** (performant but complex)

For Phase 1: **Polling** (1-2 second interval)

---

## Breaking Changes
None expected - code structure stays same, only client layer changes.

---

## Rollback Plan
- Keep Supabase alive during migration
- Switch via environment variable
- Can revert if issues found

