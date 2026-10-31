/**
 * TEMPORARY DEVELOPMENT FIXTURES
 *
 * Used solely for independent development and testing of Member 3 (Subscriptions)
 * while Member 1 (Auth & Customers) and Member 2 (Products & Plans) are building
 * their modules in parallel.
 *
 * These fixtures are NOT production data. When other modules populate the database,
 * the Prisma queries seamlessly override these fixtures.
 */

import { BillingInterval } from "@prisma/client";
import {
  SubscriptionCustomerDto,
  SubscriptionPlanDto,
  CatalogVariantPreviewDto,
} from "./subscriptions.types";

export const DEV_FIXTURE_CUSTOMERS: SubscriptionCustomerDto[] = [
  {
    id: "8f8b89e2-6014-46d4-8d9e-1e94119fa901",
    name: "Acme Technologies Pvt Ltd",
    email: "billing@acme.com",
    phone: "+91 9876543210",
    billingAddress: "42 MG Road, Bangalore, Karnataka 560001",
  },
  {
    id: "9a9c90f3-7125-57e5-9e0f-2f05220fb012",
    name: "Globex Corporation",
    email: "accounts@globex.io",
    phone: "+91 9123456789",
    billingAddress: "101 Infopark Expressway, Kochi, Kerala 682042",
  },
  {
    id: "ab0d01a4-8236-68f6-af1a-3a16331ac123",
    name: "Soylent Logistics LLP",
    email: "finance@soylentlogistics.in",
    phone: "+91 9988776655",
    billingAddress: "Plot 88, MIDC Industrial Area, Pune, Maharashtra 411018",
  },
];

export const DEV_FIXTURE_PLANS: SubscriptionPlanDto[] = [
  {
    id: "3b7f5d4e-28a1-432a-bc99-1a0a5585b9b1",
    name: "Standard Monthly Plan",
    billingInterval: BillingInterval.MONTH,
    intervalCount: 1,
    minimumQuantity: 1,
  },
  {
    id: "4c8a6e5f-39b2-543b-cd00-2b1b6696c0c2",
    name: "Annual Enterprise Plan",
    billingInterval: BillingInterval.YEAR,
    intervalCount: 1,
    minimumQuantity: 1,
  },
  {
    id: "5d9b7f6a-4ac3-654c-de11-3c2c7707d1d3",
    name: "High Volume Weekly Plan",
    billingInterval: BillingInterval.WEEK,
    intervalCount: 1,
    minimumQuantity: 5,
  },
];

export const DEV_FIXTURE_VARIANTS: CatalogVariantPreviewDto[] = [
  {
    id: "aa11bb22-3333-4444-5555-666677778888",
    productId: "p1111111-2222-3333-4444-555566667777",
    productName: "Cloud Storage Service",
    variantName: "Pro Tier 500GB",
    sku: "STRG-PRO-500",
    defaultPrice: "2500.00",
  },
  {
    id: "bb22cc33-4444-5555-6666-777788889999",
    productId: "p2222222-3333-4444-5555-666677778888",
    productName: "Dedicated Support Addon",
    variantName: "24/7 Priority Support",
    sku: "SUPP-247-PRIO",
    defaultPrice: "2680.00",
  },
  {
    id: "cc33dd44-5555-6666-7777-88889999aaaa",
    productId: "p3333333-4444-5555-6666-777788889999",
    productName: "ERP Business Suite",
    variantName: "Standard Seat License",
    sku: "ERP-SEAT-STD",
    defaultPrice: "1850.00",
  },
  {
    id: "dd44ee55-6666-7777-8888-9999aaaabbbb",
    productId: "p4444444-5555-6666-7777-88889999aaaa",
    productName: "Email Security Gateway",
    variantName: "Advanced Threat Protection",
    sku: "EML-ATP-100",
    defaultPrice: "950.00",
  },
];

export const DEV_FIXTURE_TAXES = [
  {
    id: "c4d12345-aaaa-bbbb-cccc-111122223333",
    name: "GST (18%)",
    rate: "18.00",
  },
  {
    id: "d5e23456-bbbb-cccc-dddd-222233334444",
    name: "Reduced GST (5%)",
    rate: "5.00",
  },
];

export const DEV_FIXTURE_DISCOUNTS = [
  {
    id: "e6f34567-cccc-dddd-eeee-333344445555",
    name: "Early Adopter (10%)",
    percentage: "10.00",
  },
  {
    id: "f7a45678-dddd-eeee-ffff-444455556666",
    name: "Volume Partner Discount (15%)",
    percentage: "15.00",
  },
];

