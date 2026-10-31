import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
  customerId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export {};
