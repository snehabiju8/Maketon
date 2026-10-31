import { Request, Response } from "express";
import { authService, AuthService } from "./auth.service";
import { AUTH_COOKIE_NAME, getAuthCookieOptions, getLogoutCookieOptions } from "../../lib/cookie";
import { sendSuccess } from "../../utils/api-response";

export class AuthController {
  constructor(private service: AuthService = authService) {}

  register = async (req: Request, res: Response): Promise<Response> => {
    const { session, token } = await this.service.register(req.body);

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    return sendSuccess(res, session, "Registration successful", 201);
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    const { user, token } = await this.service.login(req.body);

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    return sendSuccess(res, { user }, "Login successful", 200);
  };

  logout = async (_req: Request, res: Response): Promise<Response> => {
    res.clearCookie(AUTH_COOKIE_NAME, getLogoutCookieOptions());

    return sendSuccess(res, null, "Logged out successfully", 200);
  };

  getMe = async (req: Request, res: Response): Promise<Response> => {
    const session = await this.service.getSessionProfile(req.user!.userId);

    return sendSuccess(res, session, "Current session retrieved", 200);
  };
}

export const authController = new AuthController();
