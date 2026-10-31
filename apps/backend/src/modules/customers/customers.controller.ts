import { Request, Response } from "express";
import { customersService, CustomersService } from "./customers.service";
import { sendSuccess } from "../../utils/api-response";

export class CustomersController {
  constructor(private service: CustomersService = customersService) {}

  createCustomer = async (req: Request, res: Response): Promise<Response> => {
    const customer = await this.service.createCustomer(req.body);

    return sendSuccess(res, { customer }, "Customer profile created successfully", 201);
  };

  listCustomers = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.service.listCustomers(req.query);

    return sendSuccess(res, data, "Customers retrieved successfully", 200);
  };

  getCustomerById = async (req: Request, res: Response): Promise<Response> => {
    const customer = await this.service.getCustomerById(req.params.id, req.user!);

    return sendSuccess(res, { customer }, "Customer retrieved", 200);
  };

  updateCustomer = async (req: Request, res: Response): Promise<Response> => {
    const customer = await this.service.updateCustomer(req.params.id, req.body, req.user!);

    return sendSuccess(res, { customer }, "Customer updated successfully", 200);
  };
}

export const customersController = new CustomersController();
