# Forensics Documentation

This directory contains forensic analysis reports for investigating and resolving issues in the Farm Companion application.

## Available Reports

### 1. Database Connection Forensics
**File**: `DATABASE_CONNECTION_FORENSICS.md`
**Date**: 2026-01-22
**Issue**: PrismaClientInitializationError - Cannot reach database server

Comprehensive analysis of database connectivity issues including:
- Error analysis and root cause identification
- Environment configuration investigation
- Impact assessment on application functionality
- Multiple solution paths with detailed steps
- Recommendations for prevention

**Quick Summary**: Missing `DATABASE_URL` environment variable prevents Prisma from connecting to Supabase database.

### 2. Quick Setup Guide
**File**: `QUICK_SETUP_GUIDE.md`
**Date**: 2026-01-22
**Purpose**: Fast resolution guide for database connection issues

Step-by-step instructions for:
- Getting Supabase credentials
- Creating `.env.local` configuration
- Validating environment setup
- Testing database connectivity
- Troubleshooting common issues

**Use this first** if you just need to get up and running quickly.

## Investigation Methodology

Our forensic investigations follow this systematic approach:

1. **Error Analysis**: Examine error messages, stack traces, and logs
2. **Root Cause Identification**: Trace issue back to source
3. **Configuration Audit**: Check environment, dependencies, and settings
4. **Impact Assessment**: Determine severity and affected functionality
5. **Historical Context**: Review git history and execution ledger
6. **Solution Development**: Create multiple resolution paths
7. **Prevention Recommendations**: Suggest improvements to prevent recurrence
8. **Documentation**: Comprehensive report with actionable steps

## When to Create a Forensic Report

Create a forensic report for:

- ✅ **Production incidents** - Outages or critical failures
- ✅ **Mysterious bugs** - Issues with unclear root cause
- ✅ **Configuration problems** - Environment or setup issues affecting multiple developers
- ✅ **Performance degradation** - Unexplained slowdowns or resource issues
- ✅ **Security incidents** - Unauthorized access attempts or vulnerabilities
- ✅ **Data integrity issues** - Database corruption or inconsistent state

Do NOT create forensic reports for:

- ❌ Simple bugs with known fixes
- ❌ Feature requests or enhancements
- ❌ Documentation updates
- ❌ Minor UI/UX issues
- ❌ Code refactoring tasks

## Report Template

When creating a new forensic report, use this structure:

```markdown
# [Issue Title] Forensics Report
**Date**: YYYY-MM-DD
**Branch**: [branch-name]
**Issue**: [Brief description]

## Executive Summary
[2-3 paragraph summary of issue, root cause, and solution]

## Error Analysis
[Detailed error information, stack traces, logs]

## Root Cause Analysis
[What caused the issue and why]

## Impact Assessment
[Who/what is affected and how severely]

## Historical Context
[Relevant git history, previous related issues]

## Solutions
[Multiple solution paths with steps]

## Recommendations
[How to prevent this in the future]

## Files Referenced
[All files examined during investigation]

## Investigation Methodology
[Steps taken to identify and resolve]
```

## Tools and Scripts

### Environment Validation
**File**: `farm-frontend/scripts/validate-environment.ts`

Validates all required environment variables are configured:
```bash
cd farm-frontend
pnpm tsx scripts/validate-environment.ts
pnpm tsx scripts/validate-environment.ts --strict  # Fail on warnings
```

### Database Integrity Check
**File**: `farm-frontend/scripts/check-database-integrity.ts`

Validates database data quality (requires DATABASE_URL):
```bash
cd farm-frontend
pnpm tsx scripts/check-database-integrity.ts
```

See `scripts/README-DATABASE-INTEGRITY.md` for details.

## Related Documentation

- **Execution Ledger**: `docs/assistant/execution-ledger.md` - Work history and completed tasks
- **Deployment Guide**: `VERCEL_DEPLOYMENT.md` - Production deployment instructions
- **Taskmaster Plan**: `TASKMASTER_PLAN.md` - Strategic roadmap and success metrics
- **Environment Template**: `farm-frontend/.env.example` - All environment variables documented

## Contributing

When adding new forensic reports:

1. Follow the report template structure
2. Include date and branch information
3. Provide both quick fixes and deep analysis
4. Reference all files examined
5. Add entry to this README
6. Update execution ledger if applicable
7. Commit with descriptive message: `docs: Add forensic report for [issue]`

## Historical Reports Index

| Date | Issue | Severity | Status | Report |
|------|-------|----------|--------|--------|
| 2026-01-22 | Database Connection Error | HIGH | ✅ Documented | DATABASE_CONNECTION_FORENSICS.md |

## Maintenance

This directory should be reviewed quarterly to:
- Archive old reports that are no longer relevant
- Update quick reference guides with new common issues
- Improve investigation tooling and scripts
- Document new patterns or recurring problems

---

**Directory Maintained By**: FlowCoder (Claude Code Agent)
**Last Updated**: 2026-01-22
**Reports**: 1 forensic analysis, 1 quick guide
