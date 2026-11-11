import type { Order } from "../../src/features/store/domain/order.js";

/**
 * Fulfillment provider port. Version 1 ships with the "manual" provider:
 * the shop owner downloads the print file and places the order with an
 * external print-and-ship service by hand.
 *
 * To automate later (e.g. Gelato, Prodigi, Printful), implement this
 * interface, register it in ./index.ts and select it with the
 * FULFILLMENT_PROVIDER environment variable.
 */
export interface IFulfillmentProvider {
  readonly id: string;
  readonly label: string;
  /** Called once when an order is created. */
  onOrderCreated(order: Order): Promise<void>;
  /** Called when the owner asks to hand an order to the provider. */
  submit(order: Order): Promise<{ externalReference: string; trackingUrl?: string }>;
}
