# Authentication Guide for Developers

## Overview

EL HADEGEL uses NextAuth.js v5 (beta) for authentication with a JWT-based session system. Both the landing page and admin dashboard require authentication.

## Authentication Architecture

### Route Protection Strategy

**Approach:** Layout-level protection via Next.js route groups

**Why this approach:**
- Single source of truth (one auth check)
- Automatic protection for all child routes
- Server-side security (cannot be bypassed)
- Minimal performance overhead

### File Structure

```
app/
├── (protected)/              # Protected route group
│   ├── layout.tsx            # Auth check happens here
│   ├── page.tsx              # Landing page (requires auth)
│   └── admin/
│       ├── layout.tsx        # AdminHeader
│       └── page.tsx          # Admin dashboard (requires auth)
├── login/
│   └── page.tsx              # Public (no auth required)
├── layout.tsx                # Root layout (public)
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts      # NextAuth handlers
```

## How to Add a New Protected Route

### Step 1: Create Route in Protected Group

```bash
# Create new protected route
mkdir -p app/\(protected\)/new-feature
touch app/\(protected\)/new-feature/page.tsx
```

### Step 2: Implement Page Component

```typescript
// app/(protected)/new-feature/page.tsx
import { auth } from '@/auth';

export default async function NewFeaturePage() {
  // Session is guaranteed by parent layout
  const session = await auth();

  return (
    <div>
      <h1>Welcome, {session!.user.name}!</h1>
      {/* Your feature content */}
    </div>
  );
}
```

**That's it!** The route is automatically protected.

### Adding Navigation

To add navigation from other pages:

**In PageHeader or AdminHeader:**
```typescript
<Link href="/new-feature">
  <Button variant="outline" size="sm">
    <SomeIcon className="h-4 w-4" />
    <span>תכונה חדשה</span>
  </Button>
</Link>
```

## Session Management

### Getting Session Data

**Server Component:**
```typescript
import { auth } from '@/auth';

export default async function MyPage() {
  const session = await auth();

  // session = {
  //   user: {
  //     id: string,
  //     name: string | null,
  //     email: string,
  //   },
  //   expires: string
  // }

  return <div>{session.user.email}</div>;
}
```

**Client Component:**
```typescript
'use client';

import { useSession } from 'next-auth/react';

export function MyClientComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;

  return <div>{session.user.email}</div>;
}
```

### Logging Out

**Server Component (recommended):**
```typescript
import { signOut } from '@/auth';

export function LogoutButton() {
  return (
    <form action={async () => {
      'use server';
      await signOut({ redirectTo: '/login' });
    }}>
      <button type="submit">Logout</button>
    </form>
  );
}
```

**Client Component:**
```typescript
'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/login' })}>
      Logout
    </button>
  );
}
```

## Configuration

### Environment Variables

Required in `.env`:

```bash
# NextAuth Configuration
AUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
AUTH_URL="http://localhost:3000"     # Change in production

# Database
DATABASE_URL="postgresql://..."      # Neon PostgreSQL connection string
```

### Auth Configuration

**File:** `auth.ts`

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Find admin user
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email as string }
        });

        if (!admin) return null;

        // Verify password
        const isValid = await compare(
          credentials.password as string,
          admin.password
        );

        if (!isValid) return null;

        return {
          id: admin.id.toString(),
          email: admin.email,
          name: admin.name,
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});
```

## Security Best Practices

### 1. Server-Side Checks Only
❌ **Don't:**
```typescript
'use client';

export function MyPage() {
  const { data: session } = useSession();
  if (!session) return <div>Please login</div>;
  // User can bypass this in browser console!
}
```

✅ **Do:**
```typescript
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function MyPage() {
  const session = await auth();
  if (!session) redirect('/login');
  // Server-side check, cannot be bypassed
}
```

### 2. Use Protected Layout
Let the parent layout handle authentication:

```typescript
// app/(protected)/my-feature/page.tsx
export default async function MyFeaturePage() {
  // No auth check needed here!
  // Parent layout already checked

  return <div>Protected content</div>;
}
```

### 3. Validate Session Data
```typescript
const session = await auth();

// Use non-null assertion only in protected routes
const userId = session!.user.id;  // Safe in (protected) routes

// Or use optional chaining in shared components
const userName = session?.user?.name ?? 'Guest';
```

## Troubleshooting

### Issue: "Cannot read property 'user' of null"
**Cause:** Trying to access session before checking if it exists
**Solution:** Check session or use non-null assertion in protected routes

### Issue: Redirect loop
**Cause:** Auth check redirecting to page that also requires auth
**Solution:** Ensure `/login` is outside `(protected)` group

### Issue: Session not persisting
**Cause:** AUTH_SECRET not set or cookies blocked
**Solution:** Verify `.env` has AUTH_SECRET, check browser cookie settings

### Issue: "Route group not working"
**Cause:** Parentheses in folder name not recognized
**Solution:** Ensure folder is named `(protected)` with parentheses, restart dev server

## Testing

### Manual Testing Checklist

- [ ] Unauthenticated access to `/` redirects to `/login`
- [ ] Valid login redirects to `/`
- [ ] Session persists across page navigation
- [ ] Logout destroys session
- [ ] Cannot access protected routes after logout
- [ ] Build succeeds (`pnpm build`)

### Automated Testing (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects unauthenticated user', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('allows authenticated user', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@elhadegel.co.il');
    await page.fill('input[name="password"]', 'Tsitsi2025!!');
    await page.click('button[type="submit"]');

    // Verify redirect
    await expect(page).toHaveURL('/');

    // Verify content visible
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## Common Patterns

### Conditional Rendering Based on Auth

```typescript
'use client';

import { useSession } from 'next-auth/react';

export function UserGreeting() {
  const { data: session } = useSession();

  if (!session) return null;

  return <div>שלום, {session.user.name}!</div>;
}
```

### Protected API Routes

```typescript
// app/api/admin/route.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Protected logic here
  return NextResponse.json({ data: 'secret' });
}
```

### Redirect After Login

```typescript
// app/login/page.tsx
'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false, // Handle redirect manually
    });

    if (result?.ok) {
      router.push('/'); // Redirect to landing page
      router.refresh(); // Refresh server components
    }
  };

  // ... rest of component
}
```

## Advanced Topics

### Custom Session Data

To add custom fields to the session:

**1. Update Auth Types:**
```typescript
// types/next-auth.d.ts
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: string; // Custom field
    };
  }

  interface User {
    role: string; // Custom field
  }
}
```

**2. Update Auth Config:**
```typescript
// auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  // ... rest of config
});
```

### Role-Based Access Control

```typescript
// app/(protected)/admin-only/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminOnlyPage() {
  const session = await auth();

  if (!session) redirect('/login');
  if (session.user.role !== 'admin') redirect('/'); // Not admin

  return <div>Admin-only content</div>;
}
```

## Performance Optimization

### Session Caching

Next.js automatically caches Server Component renders, including `auth()` calls. No manual caching needed.

### Avoiding Re-Authentication

```typescript
// Once authenticated, session is cached for the request
const session1 = await auth(); // Database query
const session2 = await auth(); // Cached (same request)
```

### Optimizing Client-Side Checks

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';

// Wrap only interactive components that need session
export function ProtectedLayout({ children, session }) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
```

## Migration from Other Auth Systems

### From Custom Auth

1. Keep your existing User/Admin table
2. Update password hashing to bcrypt (if needed)
3. Replace custom auth middleware with NextAuth
4. Update components to use `auth()` / `useSession()`

### From NextAuth v4

1. Update imports: `next-auth` → `next-auth/react` (client)
2. Update auth config to v5 syntax
3. Use `auth()` instead of `getServerSession()`
4. Update callbacks syntax

## References

- [NextAuth.js v5 Documentation](https://next-auth.js.org/)
- [Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [Project CLAUDE.md](/CLAUDE.md)

## Support

For questions or issues:
1. Check this guide
2. Review [feature documentation](/docs/features/authenticated-landing-page.md)
3. Review [migration guide](/docs/migration/public-to-authenticated-landing.md)
4. Check Next.js and NextAuth.js documentation
