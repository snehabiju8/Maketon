import { Prisma, Tax } from "@prisma/client";
import { taxesRepository, TaxesRepository } from "./taxes.repository";
import { CreateTaxInput, UpdateTaxInput } from "./taxes.validation";
import { AppError } from "../../utils/app-error";

export class TaxesService {
  constructor(private readonly repo: TaxesRepository = taxesRepository) {}

  async getTaxes(isActive?: boolean): Promise<Tax[]> {
    return this.repo.findMany({ isActive });
  }

  async getTaxById(id: string): Promise<Tax> {
    const tax = await this.repo.findById(id);
    if (!tax) {
      throw AppError.notFound(`Tax with ID '${id}' not found`);
    }
    return tax;
  }

  async createTax(data: CreateTaxInput): Promise<Tax> {
    const rateDecimal = new Prisma.Decimal(
      typeof data.rate === "number" ? data.rate.toFixed(2) : String(data.rate),
    );

    return this.repo.create({
      name: data.name,
      rate: rateDecimal,
      isActive: data.isActive,
    });
  }

  async updateTax(id: string, data: UpdateTaxInput): Promise<Tax> {
    await this.getTaxById(id);

    const updatePayload: {
      name?: string;
      rate?: Prisma.Decimal;
      isActive?: boolean;
    } = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (data.rate !== undefined) {
      updatePayload.rate = new Prisma.Decimal(
        typeof data.rate === "number" ? data.rate.toFixed(2) : String(data.rate),
      );
    }

    return this.repo.update(id, updatePayload);
  }
}

export const taxesService = new TaxesService();
