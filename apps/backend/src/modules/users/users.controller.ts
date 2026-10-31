import { Request, Response } from "express";
import { usersService, UsersService } from "./users.service";
import { sendSuccess } from "../../utils/api-response";

export class UsersController {
  constructor(private service: UsersService = usersService) {}

  createStaff = async (req: Request, res: Response): Promise<Response> => {
    const user = await this.service.createStaff(req.body);

    return sendSuccess(res, { user }, "Staff account created successfully", 201);
  };

  listStaff = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.service.listStaff(req.query);

    return sendSuccess(res, data, "Staff accounts retrieved successfully", 200);
  };
}

export const usersController = new UsersController();
