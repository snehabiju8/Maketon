import { Prisma, Product, ProductStatus, ProductVariant, VariantStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export class ProductsRepository {
  async findMany(filters?: { status?: ProductStatus }): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.product.findMany({
      where,
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<(Product & { variants: ProductVariant[] }) | null> {
    return prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async create(data: {
    name: string;
    description?: string | null;
    status?: ProductStatus;
  }): Promise<Product & { variants: ProductVariant[] }> {
    return prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status ?? ProductStatus.ACTIVE,
      },
      include: {
        variants: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      status?: ProductStatus;
    },
  ): Promise<Product & { variants: ProductVariant[] }> {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async findVariantsByProductId(
    productId: string,
    filters?: { status?: VariantStatus },
  ): Promise<ProductVariant[]> {
    const where: Prisma.ProductVariantWhereInput = { productId };
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.productVariant.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
  }

  async findVariantById(
    id: string,
  ): Promise<(ProductVariant & { product: Product }) | null> {
    return prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });
  }

  async findVariantBySku(sku: string): Promise<ProductVariant | null> {
    return prisma.productVariant.findUnique({
      where: { sku },
    });
  }

  async createVariant(data: {
    productId: string;
    name: string;
    sku?: string | null;
    defaultPrice: Prisma.Decimal;
    status?: VariantStatus;
  }): Promise<ProductVariant> {
    return prisma.productVariant.create({
      data: {
        productId: data.productId,
        name: data.name,
        sku: data.sku,
        defaultPrice: data.defaultPrice,
        status: data.status ?? VariantStatus.ACTIVE,
      },
    });
  }

  async updateVariant(
    id: string,
    data: {
      name?: string;
      sku?: string | null;
      defaultPrice?: Prisma.Decimal;
      status?: VariantStatus;
    },
  ): Promise<ProductVariant> {
    return prisma.productVariant.update({
      where: { id },
      data,
    });
  }
}

export const productsRepository = new ProductsRepository();
