import { Prisma } from "@prisma/client";
import { usersRepository, UsersRepository } from "./users.repository";
import { CreateStaffInput, StaffQueryInput, StaffUserResponse } from "./users.types";
import { hashPassword } from "../../lib/password";
import { AppError } from "../../utils/app-error";

export class UsersService {
  constructor(private repo: UsersRepository = usersRepository) {}

  async createStaff(input: CreateStaffInput): Promise<StaffUserResponse> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existing = await this.repo.findUserByEmail(normalizedEmail);
    if (existing) {
      throw AppError.conflict(
        "An account with this email address already exists.",
        "EMAIL_ALREADY_EXISTS",
      );
    }

    const passwordHash = await hashPassword(input.password);

    try {
      const user = await this.repo.createStaff({
        name: input.name,
        email: normalizedEmail,
        passwordHash,
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw AppError.conflict(
          "An account with this email address already exists.",
          "EMAIL_ALREADY_EXISTS",
        );
      }
      throw error;
    }
  }

  async listStaff(query: StaffQueryInput) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { items, total } = await this.repo.listStaff(query);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const usersService = new UsersService();
