import { useCallback, useEffect, useState } from "react";
import { ApiError, cartStorage, ordersApi } from "@/core/services";
import { useStore } from "../ui/StoreContext";
import { EMPTY_CUSTOMER, type CustomerInfo } from "../domain/order";
import {
  normalizeCustomer,
  validateCustomer,
  type CustomerErrors,
} from "../domain/validation";

/** Owns the checkout form: draft persistence, validation and order placement. */
export function useCheckout() {
  const { cart, clearCart, rememberOrder } = useStore();
  const [customer, setCustomer] = useState<CustomerInfo>(() => ({
    ...EMPTY_CUSTOMER,
    ...cartStorage.loadCustomerDraft<Partial<CustomerInfo>>({}),
  }));
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => cartStorage.saveCustomerDraft(customer), 400);
    return () => clearTimeout(timer);
  }, [customer]);

  const setField = useCallback((field: keyof CustomerInfo, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const validateField = useCallback(
    (field: keyof CustomerInfo) => {
      const fieldErrors = validateCustomer(normalizeCustomer(customer));
      setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
    },
    [customer],
  );

  const placeOrder = useCallback(async (): Promise<{ number: string; accessKey: string } | null> => {
    const normalized = normalizeCustomer(customer);
    const fieldErrors = validateCustomer(normalized);
    setErrors(fieldErrors);
    setSubmitError("");
    if (Object.keys(fieldErrors).length > 0) return null;
    if (cart.length === 0) {
      setSubmitError("Your cart is empty.");
      return null;
    }

    setIsSubmitting(true);
    try {
      const { order, accessKey } = await ordersApi.createOrder({
        customer: normalized,
        paymentMethod: "cash_on_delivery",
        website: honeypot,
        items: cart.map((item) => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          design: item.design,
          summary: item.summary,
          ...(item.collection
            ? { collection: item.collection, previewDataUrl: "" }
            : { previewDataUrl: item.previewDataUrl }),
        })),
      });
      rememberOrder({ number: order.number, accessKey, createdAt: order.createdAt });
      clearCart();
      return { number: order.number, accessKey };
    } catch (error) {
      if (error instanceof ApiError && error.details?.fields) {
        setErrors(error.details.fields as CustomerErrors);
      }
      setSubmitError(
        error instanceof Error ? error.message : "We couldn't place your order. Please try again.",
      );
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [customer, cart, honeypot, rememberOrder, clearCart]);

  return {
    customer,
    setField,
    validateField,
    errors,
    submitError,
    isSubmitting,
    placeOrder,
    honeypot,
    setHoneypot,
  };
}
