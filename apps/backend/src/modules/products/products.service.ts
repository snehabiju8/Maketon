import { Prisma, Product, ProductStatus, ProductVariant, VariantStatus } from "@prisma/client";
import { productsRepository, ProductsRepository } from "./products.repository";
import {
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
} from "./products.validation";
import { AppError } from "../../utils/app-error";

export class ProductsService {
  constructor(private readonly repo: ProductsRepository = productsRepository) {}

  async getProducts(status?: ProductStatus): Promise<Product[]> {
    return this.repo.findMany({ status });
  }

  async getProductById(id: string): Promise<Product & { variants: ProductVariant[] }> {
    const product = await this.repo.findById(id);
    if (!product) {
      throw AppError.notFound(`Product with ID '${id}' not found`);
    }
    return product;
  }

  async createProduct(data: CreateProductInput): Promise<Product & { variants: ProductVariant[] }> {
    return this.repo.create({
      name: data.name,
      description: data.description,
      status: data.status as ProductStatus,
    });
  }

  async updateProduct(
    id: string,
    data: UpdateProductInput,
  ): Promise<Product & { variants: ProductVariant[] }> {
    await this.getProductById(id);

    return this.repo.update(id, {
      name: data.name,
      description: data.description,
      status: data.status as ProductStatus,
    });
  }

  async getVariantsByProductId(
    productId: string,
    status?: VariantStatus,
  ): Promise<ProductVariant[]> {
    await this.getProductById(productId);
    return this.repo.findVariantsByProductId(productId, { status });
  }

  async getVariantById(id: string): Promise<ProductVariant & { product: Product }> {
    const variant = await this.repo.findVariantById(id);
    if (!variant) {
      throw AppError.notFound(`Product variant with ID '${id}' not found`);
    }
    return variant;
  }

  async createVariant(
    productId: string,
    data: CreateVariantInput,
  ): Promise<ProductVariant> {
    const product = await this.getProductById(productId);

    // Business rule: Do not allow new variants to be created under inactive products
    if (product.status === ProductStatus.INACTIVE) {
      throw AppError.badRequest(
        "Cannot create variants for an inactive product",
        "INACTIVE_PRODUCT",
      );
    }

    // Check duplicate SKU if SKU is provided
    if (data.sku) {
      const existingSku = await this.repo.findVariantBySku(data.sku);
      if (existingSku) {
        throw AppError.conflict(
          `A variant with SKU '${data.sku}' already exists`,
          "DUPLICATE_SKU",
        );
      }
    }

    const defaultPriceDecimal = new Prisma.Decimal(data.defaultPrice.toFixed(2));

    return this.repo.createVariant({
      productId,
      name: data.name,
      sku: data.sku,
      defaultPrice: defaultPriceDecimal,
      status: data.status as VariantStatus,
    });
  }

  async updateVariant(
    id: string,
    data: UpdateVariantInput,
  ): Promise<ProductVariant> {
    const existing = await this.getVariantById(id);

    // If updating SKU, check for uniqueness conflict
    if (data.sku && data.sku !== existing.sku) {
      const existingSku = await this.repo.findVariantBySku(data.sku);
      if (existingSku && existingSku.id !== id) {
        throw AppError.conflict(
          `A variant with SKU '${data.sku}' already exists`,
          "DUPLICATE_SKU",
        );
      }
    }

    const updatePayload: {
      name?: string;
      sku?: string | null;
      defaultPrice?: Prisma.Decimal;
      status?: VariantStatus;
    } = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.sku !== undefined) updatePayload.sku = data.sku;
    if (data.status !== undefined) updatePayload.status = data.status as VariantStatus;
    if (data.defaultPrice !== undefined) {
      updatePayload.defaultPrice = new Prisma.Decimal(data.defaultPrice.toFixed(2));
    }

    return this.repo.updateVariant(id, updatePayload);
  }
}

export const productsService = new ProductsService();
