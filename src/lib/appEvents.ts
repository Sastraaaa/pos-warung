export const PRODUCTS_UPDATED_EVENT = "pos-warung:products-updated";

export function emitProductsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT));
}
