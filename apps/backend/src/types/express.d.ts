import { JwtUserPayload } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export {};
