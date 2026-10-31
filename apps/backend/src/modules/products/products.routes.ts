import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize, authorizeWrites } from "../../middleware/authorize";
import { csrfProtection } from "../../middleware/csrf";
import { productsController } from "./products.controller";
import { validateRequest } from "../../middleware/validate";
import {
  listProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  productVariantsParamSchema,
  listVariantsQuerySchema,
  createVariantSchema,
  updateVariantSchema,
  variantIdParamSchema,
} from "./products.validation";

const router = Router();

// Admins and staff can read the catalog; only admins can change it (PRD roles).
router.use(authenticate, authorize(Role.ADMIN, Role.INTERNAL), csrfProtection, authorizeWrites(Role.ADMIN));

// 1. Product Variant Endpoints by Variant ID
// Registered first to prevent /variants/:id from matching /:id
router.get(
  "/variants/:id",
  validateRequest({ params: variantIdParamSchema }),
  productsController.getVariantById,
);

router.patch(
  "/variants/:id",
  validateRequest({ params: variantIdParamSchema, body: updateVariantSchema }),
  productsController.updateVariant,
);

// 2. Product Variant Endpoints by Parent Product ID
router.get(
  "/:productId/variants",
  validateRequest({
    params: productVariantsParamSchema,
    query: listVariantsQuerySchema,
  }),
  productsController.listVariants,
);

router.post(
  "/:productId/variants",
  validateRequest({
    params: productVariantsParamSchema,
    body: createVariantSchema,
  }),
  productsController.createVariant,
);

// 3. Product Collection Endpoints
router.get(
  "/",
  validateRequest({ query: listProductsQuerySchema }),
  productsController.listProducts,
);

router.post(
  "/",
  validateRequest({ body: createProductSchema }),
  productsController.createProduct,
);

// 4. Individual Product Endpoints by Product ID
router.get(
  "/:id",
  validateRequest({ params: productIdParamSchema }),
  productsController.getProductById,
);

router.patch(
  "/:id",
  validateRequest({ params: productIdParamSchema, body: updateProductSchema }),
  productsController.updateProduct,
);

export default router;
