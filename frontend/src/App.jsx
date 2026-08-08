import { useState, useEffect, useRef } from "react";

// --- MOCK DATA ---
const DEMO_PROJECT = {
  id: "proj_taskflow_99",
  name: "TaskFlow-Pro",
  fileCount: 1284,
  symbolsCount: 8421,
  dependenciesCount: 142,
  apisCount: 87,
  docsCount: 64,
  languages: ["TypeScript", "React", "NodeJS", "PostgreSQL"],
  health: {
    architecture: 94,
    documentation: 82,
    tests: 76,
    dependencies: 91
  },
  files: {
    "src": {
      "auth": {
        "AuthService.ts": `import { db } from "../database";
import { User } from "../models/User";
import { jwt } from "jsonwebtoken";
import { bcrypt } from "bcryptjs";

export class AuthService {
  async authenticateUser(email: string, pass: string) {
    const user = await db.select().from(User).where(User.email.equals(email)).first();
    if (!user) throw new Error("Invalid credentials");
    
    const valid = await bcrypt.compare(pass, user.passwordHash);
    if (!valid) throw new Error("Invalid credentials");
    
    return {
      token: jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' }),
      user: { id: user.id, name: user.name, email: user.email }
    };
  }

  async handleCallback(provider: string, code: string) {
    // Google/GitHub OAuth Handlers
    const profile = await this.fetchExternalProfile(provider, code);
    let user = await db.select().from(User).where(User.email.equals(profile.email)).first();
    
    if (!user) {
      user = await db.insert(User).values({
        name: profile.name,
        email: profile.email,
        authProvider: provider,
        role: "developer"
      });
    }
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  }

  private async fetchExternalProfile(provider: string, code: string) {
    return { name: "Demo User", email: "user@example.com" };
  }
}`,
        "AuthController.ts": `import { Request, Response } from "express";
import { AuthService } from "./AuthService";

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.authenticateUser(email, password);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(401).json({ error: err.message });
    }
  }

  async oauthCallback(req: Request, res: Response) {
    try {
      const { provider, code } = req.query;
      const token = await authService.handleCallback(provider as string, code as string);
      return res.status(200).json({ token });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}`
      },
      "routes": {
        "auth.routes.ts": `import { Router } from "express";
import { AuthController } from "../auth/AuthController";
import { rateLimit } from "express-rate-limit";

const router = Router();
const controller = new AuthController();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later"
});

router.post("/login", authLimiter, controller.login);
router.get("/callback", controller.oauthCallback);

export default router;`
      },
      "models": {
        "User.ts": `import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const User = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  authProvider: text("auth_provider").default("local"),
  role: text("role").default("member"),
  createdAt: timestamp("created_at").defaultNow()
});`
      },
      "config": {
        "security.ts": `export const securityConfig = {
  jwtExpiration: "24h",
  saltRounds: 12,
  allowedOAuthProviders: ["google", "github"],
  rateLimitWindow: 15 * 60 * 1000,
  rateLimitMax: 100
};`
      }
    },
    "package.json": `{
  "name": "taskflow-pro",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.19.2",
    "express-rate-limit": "^7.2.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "drizzle-orm": "^0.30.10",
    "pg": "^8.11.5"
  }
}`,
    "README.md": `# TaskFlow Pro Backend Service
This repository manages TaskFlow's core authentication, relational models, and payment processing endpoints.

## Getting Started
1. Run \`npm install\`
2. Set up environment variable \`JWT_SECRET\`
3. Run \`npm run dev\` to start local development server on port 8080.`
  }
};

const MOCK_QUESTIONS = [
  {
    q: "Where should I add rate limiting to the login API?",
    ans: {
      summary: "Rate limiting is configured and added directly inside the authentication router. The router imports the `express-rate-limit` dependency and applies an `authLimiter` middleware middleware before resolving the login route.",
      relevant_files: [
        { path: "src/routes/auth.routes.ts", relevance: 98, desc: "Declares authLimiter middleware and attaches it to POST /login endpoint." },
        { path: "src/config/security.ts", relevance: 88, desc: "Houses securityConfig settings including rateLimitMax and rateLimitWindow durations." },
        { path: "src/auth/AuthController.ts", relevance: 74, desc: "Implements the controller target methods that process login request payloads." }
      ],
      functions: ["authLimiter", "login"],
      dependencies: ["express-rate-limit"],
      tokens: { original: 42800, compressed: 2150 }
    }
  },
  {
    q: "How does authentication work?",
    ans: {
      summary: "The project uses standard email/password authentication alongside a pre-wired OAuth provider flow. Password strings are encrypted and verified using `bcryptjs`. Session states are managed via JWT token signing with 24 hours expirations.",
      relevant_files: [
        { path: "src/auth/AuthService.ts", relevance: 99, desc: "Core logic for checking bcrypt hashes, creating user records, and signing JWT packages." },
        { path: "src/auth/AuthController.ts", relevance: 95, desc: "Catches API requests, extracts inputs, calls AuthService, and serializes responses." },
        { path: "src/routes/auth.routes.ts", relevance: 92, desc: "Routes GET /callback and POST /login endpoints to AuthController operations." }
      ],
      functions: ["authenticateUser", "handleCallback", "login", "oauthCallback"],
      dependencies: ["jsonwebtoken", "bcryptjs"],
      tokens: { original: 42800, compressed: 2950 }
    }
  },
  {
    q: "Where should I add Google OAuth?",
    ans: {
      summary: "To expand external identity integrations, add a callback handler method inside `AuthService.ts`, configure routing logic in `auth.routes.ts`, and declare client settings inside `security.ts` config parameters.",
      relevant_files: [
        { path: "src/auth/AuthService.ts", relevance: 97, desc: "Implements `handleCallback` and `fetchExternalProfile` to exchange code tokens for user details." },
        { path: "src/routes/auth.routes.ts", relevance: 91, desc: "Integrates authentication endpoint paths that map back to the controller action." },
        { path: "src/config/security.ts", relevance: 84, desc: "Holds list of supported identity providers to whitelist Google client authentication requests." }
      ],
      functions: ["handleCallback", "fetchExternalProfile", "oauthCallback"],
      dependencies: ["google-auth-library", "passport"],
      tokens: { original: 42800, compressed: 2800 }
    }
  }
];

// Inline SVG Icon Component to bypass lucide-react download failure
function Icon({ name, className = "h-5 w-5" }) {
  const icons = {
    "arrow-right": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    ),
    "play": (
      <svg fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M8 5.14v14l11-7-11-7z" />
      </svg>
    ),
    "cpu": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25M19.5 5.25a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25" />
      </svg>
    ),
    "github": (
      <svg fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
      </svg>
    ),
    "check": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
    "check-circle": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    "x-circle": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    "layout-dashboard": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    "search-code": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    "network": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18 18.75a2.25 2.25 0 10-4.5 0m4.5 0a2.25 2.25 0 01-4.5 0m-8.25 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM5.25 18.75a2.25 2.25 0 10-4.5 0m4.5 0a2.25 2.25 0 01-4.5 0m15-9a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 9.75a2.25 2.25 0 10-4.5 0m4.5 0a2.25 2.25 0 01-4.5 0M12 9.75V3.75m0 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 0a2.25 2.25 0 10-4.5 0m4.5 0a2.25 2.25 0 01-4.5 0" />
      </svg>
    ),
    "folder-open": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18m-18 0V7.5C2.25 6.395 3.146 5.5 4.25 5.5h2.247a1.125 1.125 0 01.814.341l1.71 1.71a1.125 1.125 0 00.814.34h8.42c1.104 0 2 .896 2 2v3.75m-18 0v4.5c0 1.104.896 2 2 2h13.5c1.104 0 2-.896 2-2v-4.5" />
      </svg>
    ),
    "folder": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0A2.25 2.25 0 003 15v3a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-3a2.25 2.25 0 00-2.25-2.25m-13.5 0h13.5" />
      </svg>
    ),
    "boxes": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 0a1.5 1.5 0 010 3m0-3h12m0 0V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 0a1.5 1.5 0 010 3" />
      </svg>
    ),
    "route": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75h6m-6 3h6m-3 5.25v3m-6.75-9.75h13.5a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0118 20.25H6a2.25 2.25 0 01-2.25-2.25V9.75A2.25 2.25 0 016 7.5z" />
      </svg>
    ),
    "book-open": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    "terminal": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    "refresh-cw": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    "key-round": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    "bar-chart-3": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    "log-out": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
      </svg>
    ),
    "sparkles": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3.096 15.096 8.192 14.284 9 9.192l.813 5.092 5.096.812-5.096.808zM19.071 9.071l-1.071 3-1.071-3-3-1.071 3-1.071 1.071-3 1.071 3 3 1.071-3 1.071z" />
      </svg>
    ),
    "loader-2": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7" />
      </svg>
    ),
    "file-code": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    "file-json": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    "file-text": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5-3h7.5M8.25 9.75h7.5" />
      </svg>
    ),
    "file-archive": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 12a1.5 1.5 0 01-1.5 1.5H5.875a1.5 1.5 0 01-1.5-1.5L3.75 7.5m16.5 0h-16.5" />
      </svg>
    ),
    "zap": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    "copy": (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125v-9.75A1.125 1.125 0 015.125 9.75h3.375m1.5 1.5h9.75c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125v-9.75c0-.621.504-1.125 1.125-1.125z" />
      </svg>
    )
  };
  return icons[name] || (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function App() {
  const [view, setView] = useState("landing"); // landing | indexer | dashboard
  const [activeTab, setActiveTab] = useState("overview"); // overview, context, architecture, files, dependencies, apis, docs, integrations, playground, sync, keys, analytics, settings
  const [githubUrl, setGithubUrl] = useState("https://github.com/developer/taskflow-pro");
  const [indexingLogs, setIndexingLogs] = useState([]);
  const [indexingProgress, setIndexingProgress] = useState(0);
  const [isIndexingComplete, setIsIndexingComplete] = useState(false);
  
  // Search / Context State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // File Explorer State
  const [selectedFilePath, setSelectedFilePath] = useState("src/auth/AuthService.ts");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [fileTreeOpen, setFileTreeOpen] = useState({ src: true, auth: true, routes: true, models: true, config: true });

  // API Keys state
  const [apiKeys, setApiKeys] = useState([
    { id: "key_1", name: "Cursor Assistant", prefix: "cc_live_9f7d2e8b", created: "08 Aug 2026", lastUsed: "2 mins ago" },
    { id: "key_2", name: "GitHub Actions Webhook", prefix: "cc_live_1d2e3f4a", created: "05 Aug 2026", lastUsed: "1 day ago" }
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState(null);

  // API Playground State
  const [playgroundQuery, setPlaygroundQuery] = useState("Where is authentication implemented?");
  const [playgroundTokenLimit, setPlaygroundTokenLimit] = useState(4000);
  const [playgroundInclude, setPlaygroundInclude] = useState(["files", "architecture", "dependencies"]);
  const [playgroundResponse, setPlaygroundResponse] = useState(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundTab, setPlaygroundTab] = useState("curl");

  // Initial selected file loading
  useEffect(() => {
    getFileContentByPath(selectedFilePath);
  }, [selectedFilePath]);

  const getFileContentByPath = (path) => {
    const parts = path.split("/");
    let current = DEMO_PROJECT.files;
    for (const part of parts) {
      if (current[part] !== undefined) {
        current = current[part];
      } else {
        current = "";
        break;
      }
    }
    setSelectedFileContent(typeof current === "string" ? current : JSON.stringify(current, null, 2));
  };

  const runIndexingSimulation = () => {
    setView("indexer");
    setIndexingProgress(0);
    setIsIndexingComplete(false);
    setIndexingLogs([]);

    const logs = [
      { time: 100, text: "Connecting repository...", status: "done" },
      { time: 600, text: "Scanning project directories...", status: "done" },
      { time: 1000, text: "Found 1,284 files to analyze", status: "info" },
      { time: 1400, text: "Detecting project languages (TypeScript 84%, CSS 11%, HTML 5%)...", status: "done" },
      { time: 1800, text: "Parsing abstract syntax tree (AST)...", status: "done" },
      { time: 2400, text: "Extracted 8,421 code symbols, methods, and classes", status: "info" },
      { time: 2800, text: "Building relational model of codebase architecture...", status: "done" },
      { time: 3300, text: "Resolved 142 module dependencies...", status: "done" },
      { time: 3800, text: "Mapped 87 Express/Next API endpoints", status: "info" },
      { time: 4200, text: "Generating codebase documentation summaries...", status: "done" },
      { time: 4700, text: "Building vector index embeddings for semantic retrieval...", status: "done" },
      { time: 5000, text: "Codebase Context Hub Knowledge base successfully built!", status: "success" }
    ];

    logs.forEach((logItem, index) => {
      setTimeout(() => {
        setIndexingLogs(prev => [...prev, logItem]);
        setIndexingProgress(Math.min(100, Math.round(((index + 1) / logs.length) * 100)));
        if (index === logs.length - 1) {
          setIsIndexingComplete(true);
        }
      }, logItem.time);
    });
  };

  // Search execution
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults(null);

    setTimeout(() => {
      const queryLower = searchQuery.toLowerCase();
      let bestMatch = MOCK_QUESTIONS[0];
      let maxScore = 0;

      MOCK_QUESTIONS.forEach(item => {
        const keywords = item.q.toLowerCase().split(" ");
        let score = 0;
        keywords.forEach(kw => {
          if (queryLower.includes(kw)) score++;
        });
        if (score > maxScore) {
          maxScore = score;
          bestMatch = item;
        }
      });

      setSearchResults(bestMatch.ans);
      setIsSearching(false);
    }, 800);
  };

  const handleCreateKey = (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const token = "cc_live_" + Array.from({length: 24}, () => Math.floor(Math.random()*16).toString(16)).join("");
    const newKey = {
      id: "key_" + (apiKeys.length + 1),
      name: newKeyName,
      prefix: token.substring(0, 16) + "...",
      created: "Just now",
      lastUsed: "Never"
    };

    setApiKeys(prev => [...prev, newKey]);
    setGeneratedKey(token);
    setNewKeyName("");
  };

  const handleRevokeKey = (id) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  const handlePlaygroundSend = () => {
    setPlaygroundLoading(true);
    setPlaygroundResponse(null);

    setTimeout(() => {
      const queryLower = playgroundQuery.toLowerCase();
      let contextData = MOCK_QUESTIONS[0].ans;
      if (queryLower.includes("oauth") || queryLower.includes("google")) {
        contextData = MOCK_QUESTIONS[2].ans;
      } else if (queryLower.includes("auth") || queryLower.includes("login")) {
        contextData = MOCK_QUESTIONS[1].ans;
      }

      setPlaygroundResponse({
        project_id: "proj_taskflow_99",
        query: playgroundQuery,
        context: {
          summary: contextData.summary,
          relevant_files: contextData.relevant_files.map(f => ({ path: f.path, relevance: f.relevance / 100 })),
          symbols: contextData.functions.map(fn => ({ name: fn, type: "function" })),
          dependencies: contextData.dependencies,
          architecture: {
            nodes: ["AuthService", "AuthController", "AuthRouter"],
            edges: ["AuthRouter -> AuthController", "AuthController -> AuthService"]
          }
        },
        metadata: {
          files_analyzed: 1284,
          files_returned: contextData.relevant_files.length,
          tokens_saved: contextData.tokens.original - contextData.tokens.compressed,
          relevance_score: 0.96
        }
      });
      setPlaygroundLoading(false);
    }, 1000);
  };

  const getPlaygroundCode = () => {
    const queryStr = JSON.stringify({
      project_id: "proj_taskflow_99",
      query: playgroundQuery,
      max_tokens: playgroundTokenLimit,
      include: playgroundInclude
    }, null, 2);

    if (playgroundTab === "curl") {
      return `curl -X POST https://api.codecontext.io/v1/context/query \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer cc_live_********" \\
  -d '${queryStr.replace(/'/g, "\\'")}'`;
    } else if (playgroundTab === "js") {
      return `fetch("https://api.codecontext.io/v1/context/query", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer cc_live_********"
  },
  body: JSON.stringify(${queryStr})
})
.then(res => res.json())
.then(data => console.log(data.context.summary));`;
    } else {
      return `import requests

url = "https://api.codecontext.io/v1/context/query"
headers = {
    "Authorization": "Bearer cc_live_********",
    "Content-Type": "application/json"
}
payload = ${queryStr}

response = requests.post(url, json=payload, headers=headers)
print(response.json()["context"]["summary"])`;
    }
  };

  if (view === "landing") {
    return (
      <div className="min-h-screen bg-brand-darkBg text-white flex flex-col justify-between">
        {/* Header */}
        <header className="border-b border-brand-border py-4 px-6 md:px-12 flex justify-between items-center glass-panel sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-cyan flex items-center justify-center font-bold text-lg text-black shadow-md glow-purple">C</div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-brand-textMuted bg-clip-text text-transparent">CodeContext Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { setView("indexer"); runIndexingSimulation(); }} className="text-sm text-brand-textMuted hover:text-white transition">Explore Sandbox</button>
            <button onClick={() => setView("indexer")} className="bg-brand-purple hover:bg-brand-purpleDark px-4 py-2 rounded-lg text-sm font-semibold transition glow-purple">
              Get Started
            </button>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-20 flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 flex flex-col justify-center text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-brand-purple/10 border border-brand-purple/30 rounded-full px-3 py-1 text-xs text-brand-purple mb-6 mx-auto lg:mx-0 w-fit">
              <span className="h-2 w-2 rounded-full bg-brand-cyan animate-pulse"></span>
              Introducing Codebase Context API Layer
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              One Codebase.<br />
              Every AI.<br />
              <span className="bg-gradient-to-r from-brand-purple via-brand-cyan to-brand-purple bg-clip-text text-transparent">Zero Repetition.</span>
            </h1>
            <p className="text-lg text-brand-textMuted mb-8 max-w-xl mx-auto lg:mx-0">
              Index your software project once. Deliver highly compressed, token-optimized context to cursor, Claude, ChatGPT, or custom agents via a unified developer API.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button onClick={() => setView("indexer")} className="bg-brand-purple hover:bg-brand-purpleDark text-white px-8 py-4 rounded-xl font-bold text-lg transition duration-200 shadow-lg hover:shadow-brand-purple/20 flex items-center justify-center gap-2 glow-purple">
                Add Your Repository <Icon name="arrow-right" className="h-5 w-5" />
              </button>
              <button onClick={() => { setView("indexer"); runIndexingSimulation(); }} className="bg-zinc-900 border border-brand-border hover:bg-zinc-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition duration-200 flex items-center justify-center gap-2">
                Explore Mock Sandbox <Icon name="play" className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-xl lg:max-w-none">
            <div className="glass-panel border border-brand-border rounded-2xl p-8 glow-purple flex flex-col gap-6 relative">
              <div className="absolute top-0 right-0 h-40 w-40 bg-brand-purple/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 h-40 w-40 bg-brand-cyan/10 rounded-full blur-3xl"></div>

              <h3 className="text-sm font-semibold tracking-wider text-brand-textMuted uppercase border-b border-brand-border/60 pb-3">Unified Context Topology</h3>
              
              <div className="flex items-center justify-between bg-zinc-900/80 border border-brand-border p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Icon name="github" className="h-6 w-6 text-brand-textMuted" />
                  <div>
                    <h4 className="text-sm font-semibold">your-project-repository</h4>
                    <p className="text-xs text-brand-textMuted">1,284 source files</p>
                  </div>
                </div>
                <span className="bg-brand-purple/20 text-brand-purple px-2 py-0.5 rounded text-xs border border-brand-purple/30">Connect</span>
              </div>

              <div className="flex justify-center -my-2">
                <div className="h-8 w-0.5 bg-gradient-to-b from-brand-purple to-brand-cyan animate-pulse"></div>
              </div>

              <div className="bg-gradient-to-r from-brand-purple/20 to-brand-cyan/20 border border-brand-purple/40 p-6 rounded-2xl text-center relative overflow-hidden anim-border">
                <h4 className="text-base font-bold text-white mb-1 flex items-center justify-center gap-2">
                  <Icon name="cpu" className="h-5 w-5 text-brand-cyan" /> CodeContext Hub
                </h4>
                <p className="text-xs text-brand-textMuted mb-2">AST Parser • Embedding Matrix • Vector Cache</p>
              </div>

              <div className="flex justify-center -my-2">
                <div className="h-8 w-0.5 bg-gradient-to-b from-brand-cyan to-brand-purple animate-pulse"></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-950 border border-brand-border p-3 rounded-lg text-center">
                  <div className="text-xs font-bold text-white">Cursor</div>
                </div>
                <div className="bg-zinc-950 border border-brand-border p-3 rounded-lg text-center">
                  <div className="text-xs font-bold text-white">Claude 3.5</div>
                </div>
                <div className="bg-zinc-950 border border-brand-border p-3 rounded-lg text-center">
                  <div className="text-xs font-bold text-white">Gemini 1.5</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-brand-border py-8 text-center text-sm text-brand-textMuted">
          <p>© 2026 CodeContext Hub. Built for Hackathons & Heavy Developer Operations.</p>
        </footer>
      </div>
    );
  }

  if (view === "indexer") {
    return (
      <div className="min-h-screen bg-brand-darkBg text-white flex flex-col justify-center items-center p-6">
        <div className="max-w-2xl w-full bg-brand-cardBg border border-brand-border rounded-2xl p-8 shadow-2xl relative">
          
          {!isIndexingComplete ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-brand-purple/20 rounded-lg flex items-center justify-center">
                  <Icon name="cpu" className="h-6 w-6 text-brand-purple animate-spin" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">AST Ingestion Pipeline</h2>
                  <p className="text-xs text-brand-textMuted">Analyzing project structures and mapping reference indexes</p>
                </div>
              </div>

              <div className="w-full bg-zinc-800 rounded-full h-2 mb-6 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-brand-purple to-brand-cyan h-2 rounded-full transition-all duration-300"
                  style={{ width: `${indexingProgress}%` }}
                ></div>
              </div>

              <div className="bg-black/80 border border-brand-border rounded-xl p-4 font-mono text-xs h-64 overflow-y-auto space-y-2 mb-6 text-left">
                {indexingLogs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    {log.status === "done" && <span className="text-green-500">✓</span>}
                    {log.status === "info" && <span className="text-brand-cyan">ℹ</span>}
                    {log.status === "success" && <span className="text-purple-400">★</span>}
                    <span className="text-zinc-300">{log.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs text-brand-textMuted">
                <span>Status: Processing AST symbols...</span>
                <span>{indexingProgress}% Complete</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="h-16 w-16 bg-green-500/10 border border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="check" className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Analysis Complete!</h2>
              <p className="text-sm text-brand-textMuted max-w-md mx-auto mb-8">
                Your repository has been successfully analyzed. We extracted 8,421 symbols and registered 87 endpoints.
              </p>

              <button 
                onClick={() => setView("dashboard")} 
                className="bg-brand-purple hover:bg-brand-purpleDark px-8 py-3 rounded-xl font-bold transition shadow-lg hover:shadow-brand-purple/20 inline-flex items-center gap-2"
              >
                Enter Dashboard <Icon name="arrow-right" className="h-5 w-5" />
              </button>
            </div>
          )}

          {indexingLogs.length === 0 && (
            <div className="absolute inset-0 bg-brand-cardBg rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Add Project to Context Hub</h2>
                <p className="text-sm text-brand-textMuted mb-6">Select a connection method to begin parsing source relationships.</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="border border-brand-purple bg-brand-purple/5 p-4 rounded-xl cursor-pointer text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="github" className="h-5 w-5 text-brand-purple" />
                      <span className="text-sm font-semibold">GitHub Repo</span>
                    </div>
                    <p className="text-[11px] text-brand-textMuted">Connect public/private git repositories</p>
                  </div>
                  <div onClick={() => runIndexingSimulation()} className="border border-brand-border hover:border-brand-purple p-4 rounded-xl cursor-pointer transition text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="file-archive" className="h-5 w-5 text-brand-textMuted" />
                      <span className="text-sm font-semibold">Demo Sandbox</span>
                    </div>
                    <p className="text-[11px] text-brand-textMuted">Pre-load sandbox workspace data</p>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs text-brand-textMuted mb-1 font-semibold">Repository URL</label>
                    <input 
                      type="text" 
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-purple"
                      placeholder="https://github.com/org/repo"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setView("landing")} className="px-4 py-2 border border-brand-border rounded-lg text-sm text-brand-textMuted hover:text-white transition">Cancel</button>
                <button onClick={runIndexingSimulation} className="px-6 py-2 bg-brand-purple hover:bg-brand-purpleDark rounded-lg text-sm font-semibold transition glow-purple">Analyze Repository</button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-darkBg text-white flex text-left">
      
      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-brand-border flex flex-col justify-between glass-panel hidden md:flex shrink-0">
        <div>
          <div className="p-6 border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-gradient-to-tr from-brand-purple to-brand-cyan flex items-center justify-center font-bold text-sm text-black">C</div>
              <div className="leading-none">
                <span className="font-bold text-sm block">CodeContext</span>
                <span className="text-[10px] text-brand-cyan font-semibold">TaskFlow API Pro</span>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
          </div>

          <nav className="p-4 space-y-1 text-sm">
            <button 
              onClick={() => setActiveTab("overview")} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeTab === "overview" ? "bg-zinc-800 text-white font-medium" : "text-brand-textMuted hover:text-white hover:bg-zinc-900/50"}`}
            >
              <Icon name="layout-dashboard" className="h-4 w-4" /> Overview
            </button>
            <button 
              onClick={() => setActiveTab("context")} 
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${activeTab === "context" ? "bg-zinc-800 text-white font-medium" : "text-brand-textMuted hover:text-white hover:bg-zinc-900/50"}`}
            >
              <div className="flex items-center gap-3">
                <Icon name="search-code" className="h-4 w-4" /> Context Explorer
              </div>
              <span className="text-[9px] bg-brand-purple/20 text-brand-purple px-1.5 py-0.5 rounded font-bold border border-brand-purple/30">AI</span>
            </button>
            <button 
              onClick={() => setActiveTab("architecture")} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeTab === "architecture" ? "bg-zinc-800 text-white font-medium" : "text-brand-textMuted hover:text-white hover:bg-zinc-900/50"}`}
            >
              <Icon name="network" className="h-4 w-4" /> Architecture Graph
            </button>
            <button 
              onClick={() => setActiveTab("files")} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeTab === "files" ? "bg-zinc-800 text-white font-medium" : "text-brand-textMuted hover:text-white hover:bg-zinc-900/50"}`}
            >
              <Icon name="folder-open" className="h-4 w-4" /> File Explorer
            </button>
            <button 
              onClick={() => setActiveTab("dependencies")} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeTab === "dependencies" ? "bg-zinc-800 text-white font-medium" : "text-brand-textMuted hover:text-white hover:bg-zinc-900/50"}`}
            >
              <Icon name="boxes" className="h-4 w-4" /> Dependencies
            </button>
            <button 
              onClick={() => setActiveTab("apis")} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeTab === "apis" ? "bg-zinc-800 text-white font-medium" : "text-brand-textMuted hover:text-white hover:bg-zinc-900/50"}`}
            >
              <Icon name="route" className="h-4 w-4" /> API Directory
            </button>
            <button 
              onClick={() => setActiveTab("docs")} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeTab === "docs" ? "bg-zinc-800 text-white font-medium" : "text-brand-textMuted hover:text-white hover:bg-zinc-900/50"}`}
            >
              <Icon name="book-open" className="h-4 w-4" /> Documentation
            </button>

            <div className="pt-4 border-t border-brand-border/60 my-2"></div>

            <button 
              onClick={() => setActiveTab("integrations")} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeTab === "integrations" ? "bg-zinc-800 text-white font-medium" : "text-brand-textMuted hover:text-white hover:bg-zinc-900/50"}`}
            >
              <Icon name="cpu" className="h-4 w-4" /> AI Integrations
            </button>
            <button 
              onClick={() => setActiveTab("playground")} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeTab === "playground" ? "bg-zinc-800 text-white font-medium" : "text-brand-textMuted hover:text-white hover:bg-zinc-900/50"}`}
            >
              <Icon name="terminal" className="h-4 w-4" /> API Playground
            </button>
            <button 
              onClick={() => setActiveTab("sync")} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeTab === "sync" ? "bg-zinc-800 text-white font-medium" : "text-brand-textMuted hover:text-white hover:bg-zinc-900/50"}`}
            >
              <Icon name="refresh-cw" className="h-4 w-4" /> Sync History
            </button>
            <button 
              onClick={() => setActiveTab("keys")} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeTab === "keys" ? "bg-zinc-800 text-white font-medium" : "text-brand-textMuted hover:text-white hover:bg-zinc-900/50"}`}
            >
              <Icon name="key-round" className="h-4 w-4" /> API Keys
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-brand-border">
          <button onClick={() => setView("landing")} className="w-full flex items-center justify-center gap-2 text-xs text-brand-textMuted hover:text-white border border-brand-border hover:border-brand-purple/40 py-2 rounded-lg transition bg-zinc-900/40">
            <Icon name="log-out" className="h-3.5 w-3.5" /> Exit Sandbox
          </button>
        </div>
      </aside>

      {/* Main container */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-brand-border py-4 px-6 md:px-8 flex justify-between items-center glass-panel sticky top-0 z-40">
          <h2 className="text-base font-semibold">Workspace: {DEMO_PROJECT.name}</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-full border border-brand-border">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-brand-textMuted">Hook Connected</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-brand-cardBg border border-brand-border p-5 rounded-xl">
                  <span className="text-xs text-brand-textMuted block mb-1">Index Files</span>
                  <span className="text-2xl font-bold font-mono">1,284</span>
                </div>
                <div className="bg-brand-cardBg border border-brand-border p-5 rounded-xl">
                  <span className="text-xs text-brand-textMuted block mb-1">AST Symbols</span>
                  <span className="text-2xl font-bold font-mono">8,421</span>
                </div>
                <div className="bg-brand-cardBg border border-brand-border p-5 rounded-xl">
                  <span className="text-xs text-brand-textMuted block mb-1">Dependencies</span>
                  <span className="text-2xl font-bold font-mono">142</span>
                </div>
                <div className="bg-brand-cardBg border border-brand-border p-5 rounded-xl">
                  <span className="text-xs text-brand-textMuted block mb-1">API Endpoints</span>
                  <span className="text-2xl font-bold font-mono">87</span>
                </div>
                <div className="bg-brand-cardBg border border-brand-border p-5 rounded-xl">
                  <span className="text-xs text-brand-textMuted block mb-1">Docs Chapters</span>
                  <span className="text-2xl font-bold font-mono">64</span>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="bg-brand-cardBg border border-brand-border rounded-xl p-6 lg:col-span-2">
                  <h3 className="font-bold text-lg mb-1">Architecture & Health Analysis</h3>
                  <p className="text-xs text-brand-textMuted mb-6">Percentage metric breakdown of parsed module hierarchies.</p>
                  
                  <div className="space-y-6 pt-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Architecture Mapping</span>
                        <span className="font-bold text-brand-purple">94%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                        <div className="bg-brand-purple h-full" style={{ width: "94%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Documentation Coverage</span>
                        <span className="font-bold text-brand-cyan">82%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                        <div className="bg-brand-cyan h-full" style={{ width: "82%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Test Verification Mapping</span>
                        <span className="font-bold text-pink-500">76%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                        <div className="bg-pink-500 h-full" style={{ width: "76%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-cardBg border border-brand-border rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-1 font-sans">Project Scorecards</h3>
                  <p className="text-xs text-brand-textMuted mb-6">Quality overview checklist items.</p>
                  <div className="space-y-3 text-xs text-zinc-300">
                    <div className="flex items-center gap-2"><span className="text-green-500">✓</span> <span>87 of 87 endpoints fully resolved</span></div>
                    <div className="flex items-center gap-2"><span className="text-green-500">✓</span> <span>Vector lookup index initialized</span></div>
                    <div className="flex items-center gap-2"><span className="text-green-500">✓</span> <span>Automatic webhooks mapped</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "context" && (
            <div className="space-y-8">
              <div className="bg-brand-cardBg border border-brand-border rounded-xl p-8 text-center relative overflow-hidden">
                <h3 className="text-2xl font-bold mb-2">Ask Your Codebase</h3>
                <p className="text-sm text-brand-textMuted max-w-lg mx-auto mb-6">
                  Search or ask context-specific questions. CodeContext scans the index, finds files, and constructs optimized retrieval payloads.
                </p>

                <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-3 mb-6">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask anything about your project... (e.g. Google OAuth, Rate limiting, AuthService)"
                    className="flex-1 bg-zinc-900/80 border border-brand-border focus:border-brand-purple px-4 py-3 rounded-xl text-sm focus:outline-none text-white shadow-inner"
                  />
                  <button type="submit" disabled={isSearching} className="bg-brand-purple hover:bg-brand-purpleDark text-white px-6 py-3 rounded-xl font-semibold transition shrink-0 flex items-center gap-2">
                    {isSearching ? "Searching..." : <Icon name="sparkles" className="h-4 w-4" />}
                  </button>
                </form>

                <div className="flex flex-wrap gap-2 justify-center">
                  {MOCK_QUESTIONS.map((item, index) => (
                    <button 
                      key={index} 
                      onClick={() => { setSearchQuery(item.q); setSearchResults(item.ans); }}
                      className="text-xs bg-zinc-900 border border-brand-border hover:border-brand-purple px-3 py-1.5 rounded-full text-brand-textMuted hover:text-white transition"
                    >
                      "{item.q}"
                    </button>
                  ))}
                </div>
              </div>

              {searchResults && (
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-brand-cardBg border border-brand-border rounded-xl p-6">
                      <h4 className="font-bold text-base mb-3 text-brand-cyan">AI Context Summary</h4>
                      <p className="text-sm leading-relaxed text-zinc-300">{searchResults.summary}</p>
                    </div>

                    <div className="bg-brand-cardBg border border-brand-border rounded-xl p-6">
                      <h4 className="font-bold text-base mb-3">Matching Code Files</h4>
                      <div className="space-y-3">
                        {searchResults.relevant_files.map((file, idx) => (
                          <div key={idx} className="flex justify-between items-start p-3 bg-zinc-900/60 border border-brand-border rounded-lg">
                            <div>
                              <span onClick={() => { setSelectedFilePath(file.path); setActiveTab("files"); }} className="text-sm font-semibold hover:text-brand-purple cursor-pointer hover:underline block">{file.path}</span>
                              <span className="text-xs text-brand-textMuted">{file.desc}</span>
                            </div>
                            <span className="bg-brand-cyan/10 text-brand-cyan text-xs font-semibold px-2 py-0.5 rounded border border-brand-cyan/20">
                              {file.relevance}% Match
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-brand-cardBg border border-brand-border rounded-xl p-6 text-center">
                      <h4 className="font-bold text-base mb-4 text-left">Context Packaging Ratio</h4>
                      <div className="space-y-4 my-4">
                        <div className="bg-brand-purple/10 border border-brand-purple/20 py-4 rounded-lg">
                          <span className="text-3xl font-extrabold text-white block">
                            {((1 - (searchResults.tokens.compressed / 42800)) * 100).toFixed(1)}%
                          </span>
                          <span className="text-xs text-brand-textMuted">Reduction in overall context tokens</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "architecture" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">Interactive Architecture Graph</h3>
              <div className="bg-zinc-950 border border-brand-border rounded-xl h-[450px] relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                <div className="relative w-full h-full flex flex-col justify-around items-center py-10">
                  <div className="bg-zinc-900 border border-brand-border px-4 py-2 rounded-lg">
                    <span className="text-[10px] text-brand-textMuted block">Router</span>
                    <span className="font-mono text-xs">auth.routes.ts</span>
                  </div>
                  <div className="bg-brand-purple/15 border border-brand-purple px-4 py-2 rounded-lg">
                    <span className="text-[10px] text-brand-purple block">Controller</span>
                    <span className="font-mono text-xs">AuthController.ts</span>
                  </div>
                  <div className="bg-brand-cyan/15 border border-brand-cyan px-4 py-2 rounded-lg">
                    <span className="text-[10px] text-brand-cyan block">Service</span>
                    <span className="font-mono text-xs">AuthService.ts</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="grid lg:grid-cols-3 gap-6 h-[550px]">
              <div className="bg-brand-cardBg border border-brand-border rounded-xl p-4 overflow-y-auto">
                <h4 className="font-bold text-sm mb-4">Repository Files</h4>
                <div className="space-y-1 text-xs">
                  <div className="p-1.5 hover:bg-zinc-800 rounded cursor-pointer" onClick={() => setSelectedFilePath("src/auth/AuthService.ts")}>src/auth/AuthService.ts</div>
                  <div className="p-1.5 hover:bg-zinc-800 rounded cursor-pointer" onClick={() => setSelectedFilePath("src/auth/AuthController.ts")}>src/auth/AuthController.ts</div>
                  <div className="p-1.5 hover:bg-zinc-800 rounded cursor-pointer" onClick={() => setSelectedFilePath("src/routes/auth.routes.ts")}>src/routes/auth.routes.ts</div>
                  <div className="p-1.5 hover:bg-zinc-800 rounded cursor-pointer" onClick={() => setSelectedFilePath("src/models/User.ts")}>src/models/User.ts</div>
                  <div className="p-1.5 hover:bg-zinc-800 rounded cursor-pointer" onClick={() => setSelectedFilePath("src/config/security.ts")}>src/config/security.ts</div>
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col h-full bg-brand-cardBg border border-brand-border rounded-xl overflow-hidden">
                <div className="bg-zinc-900 px-4 py-2 border-b border-brand-border font-mono text-xs text-zinc-300">
                  {selectedFilePath}
                </div>
                <pre className="flex-1 p-4 overflow-auto bg-black/80 font-mono text-xs text-zinc-300 whitespace-pre text-left">
                  {selectedFileContent}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "playground" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg font-sans">API Playground</h3>
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-brand-cardBg border border-brand-border rounded-xl p-6 space-y-4">
                  <label className="block text-xs text-brand-textMuted font-semibold">Natural Language Query</label>
                  <input 
                    type="text" 
                    value={playgroundQuery}
                    onChange={(e) => setPlaygroundQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-brand-border rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <button onClick={handlePlaygroundSend} className="w-full bg-brand-purple text-white py-2 rounded-lg text-xs font-semibold">
                    Execute Query
                  </button>
                </div>

                <div className="bg-zinc-950 border border-brand-border rounded-xl p-4 font-mono text-xs">
                  {playgroundResponse ? (
                    <pre className="text-green-400 overflow-auto max-h-[300px] text-left">{JSON.stringify(playgroundResponse, null, 2)}</pre>
                  ) : (
                    <span className="text-zinc-500">Run code snippet or query to see JSON output response.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "keys" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">API Authentication Keys</h3>
              <div className="bg-brand-cardBg border border-brand-border rounded-xl p-6">
                <form onSubmit={handleCreateKey} className="flex gap-4">
                  <input 
                    type="text" 
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="E.g. VS Code Extension" 
                    className="flex-1 bg-zinc-900 border border-brand-border rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <button type="submit" className="bg-brand-purple text-white px-4 py-2 rounded-lg text-xs font-semibold">
                    Generate
                  </button>
                </form>

                {generatedKey && (
                  <div className="mt-4 p-4 bg-brand-purple/10 border border-brand-purple/20 rounded-lg text-xs font-mono">
                    <span>Key: {generatedKey}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

export default App;