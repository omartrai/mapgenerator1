import type { CustomerInfo } from "./order.js";

export type CustomerErrors = Partial<Record<keyof CustomerInfo, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+()\-.\s\d]{6,24}$/;
/** 06/07/05 + 8 digits, or the same with +212 / 00212 instead of the 0. */
const MOROCCAN_PHONE = /^(?:\+212|00212|0)[5-7]\d{8}$/;
const MOROCCO_NAMES = new Set(["morocco", "maroc", "المغرب", "ma"]);

export function isMorocco(country: string): boolean {
  return MOROCCO_NAMES.has(country.trim().toLowerCase());
}

export const CUSTOMER_FIELD_LIMITS: Record<keyof CustomerInfo, number> = {
  fullName: 120,
  email: 160,
  phone: 32,
  address: 240,
  city: 120,
  postalCode: 16,
  country: 80,
  notes: 600,
};

export function normalizeCustomer(input: Partial<CustomerInfo> | null | undefined): CustomerInfo {
  const read = (key: keyof CustomerInfo) =>
    String(input?.[key] ?? "")
      .replace(/\s+/g, key === "notes" || key === "address" ? " " : " ")
      .trim()
      .slice(0, CUSTOMER_FIELD_LIMITS[key]);
  return {
    fullName: read("fullName"),
    email: read("email").toLowerCase(),
    phone: read("phone"),
    address: read("address"),
    city: read("city"),
    postalCode: read("postalCode"),
    country: read("country"),
    notes: read("notes"),
  };
}

export function validateCustomer(customer: CustomerInfo): CustomerErrors {
  const errors: CustomerErrors = {};
  if (customer.fullName.length < 2) errors.fullName = "Please enter your full name.";
  if (!EMAIL_PATTERN.test(customer.email)) errors.email = "Please enter a valid email address.";
  const compactPhone = customer.phone.replace(/[\s().-]/g, "");
  const phoneOk = isMorocco(customer.country)
    ? MOROCCAN_PHONE.test(compactPhone)
    : PHONE_PATTERN.test(customer.phone) && customer.phone.replace(/\D/g, "").length >= 6;
  if (!phoneOk) errors.phone = "Please enter a valid phone number.";
  if (customer.address.length < 5) errors.address = "Please enter your street address.";
  if (customer.city.length < 2) errors.city = "Please enter your city.";
  // Postal codes are optional: many Moroccan addresses are delivered without one.
  if (customer.postalCode && !/^[A-Za-z0-9\- ]{2,16}$/.test(customer.postalCode)) {
    errors.postalCode = "Please enter a valid postal code.";
  }
  if (customer.country.length < 2) errors.country = "Please enter your country.";
  return errors;
}
