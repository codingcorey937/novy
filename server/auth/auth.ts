import type { Express, Request, Response, NextFunction } from "express";

// Basic authentication setup placeholder
// Replace with your own auth logic (OIDC, Passport, etc.)

export function setupAuth(app: Express) {
  // Example: add session handling or passport initialization
  // app.use(session({ ... }));
  // app.use(passport.initialize());
  // app.use(passport.session());
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export function getSession(req: Request) {
  // Access the session object (if using express-session)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (req as any).session;
}
