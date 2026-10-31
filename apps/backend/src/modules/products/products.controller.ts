import { Request, Response } from "express";
import { ProductStatus, VariantStatus } from "@prisma/client";
import { productsService, ProductsService } from "./products.service";
import { sendSuccess } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";

export class ProductsController {
  constructor(private readonly service: ProductsService = productsService) {}

  listProducts = asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as ProductStatus | undefined;
    const products = await this.service.getProducts(status);
    return sendSuccess(res, products, "Products retrieved successfully", 200);
  });

  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await this.service.createProduct(req.body);
    return sendSuccess(res, product, "Product created successfully", 201);
  });

  getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await this.service.getProductById(id);
    return sendSuccess(res, product, "Product retrieved successfully", 200);
  });

  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = await this.service.updateProduct(id, req.body);
    return sendSuccess(res, updated, "Product updated successfully", 200);
  });

  listVariants = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const status = req.query.status as VariantStatus | undefined;
    const variants = await this.service.getVariantsByProductId(productId, status);
    return sendSuccess(res, variants, "Product variants retrieved successfully", 200);
  });

  createVariant = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const variant = await this.service.createVariant(productId, req.body);
    return sendSuccess(res, variant, "Product variant created successfully", 201);
  });

  getVariantById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const variant = await this.service.getVariantById(id);
    return sendSuccess(res, variant, "Product variant retrieved successfully", 200);
  });

  updateVariant = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = await this.service.updateVariant(id, req.body);
    return sendSuccess(res, updated, "Product variant updated successfully", 200);
  });
}

export const productsController = new ProductsController();
