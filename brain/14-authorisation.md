# 14 – Authorisation

## Status

**No authorisation system exists.**

- Single set of credentials for all users
- No roles, permissions, or access levels
- No per-user data scoping
- No admin vs. regular user distinction
- All API endpoints are accessible to any authenticated user

## Implications

- Anyone with the credentials can access all data including all store details
- The AI endpoint can be called by anyone (though they need their own OpenAI API key)
- No audit trail of who accessed what

## If authorisation were needed

Potential roles:
1. **Admin** — full dashboard access, all stores
2. **Store manager** — filtered to their own store/chain
3. **Viewer** — read-only, no AI generator
