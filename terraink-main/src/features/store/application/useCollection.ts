import { useEffect, useState } from "react";
import { collectionApi } from "@/core/services";
import type { CollectionMockup, CollectionProduct } from "../domain/collection";

type Status = "loading" | "ready" | "error";

// One fetch per page load; the server and CDN cache the catalogue too.
let listPromise: Promise<CollectionProduct[]> | null = null;

function loadList(): Promise<CollectionProduct[]> {
  listPromise ??= collectionApi
    .list()
    .then((body) => body.products ?? [])
    .catch((error) => {
      listPromise = null;
      throw error;
    });
  return listPromise;
}

/** The ready-made collection (empty when the print partner isn't connected). */
export function useCollection() {
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let active = true;
    loadList()
      .then((list) => {
        if (!active) return;
        setProducts(list);
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, []);

  return { products, status };
}

/** One collection product with its mockup photos. */
export function useCollectionProduct(id: number) {
  const [data, setData] = useState<{ product: CollectionProduct; mockups: CollectionMockup[] } | null>(null);
  const [status, setStatus] = useState<Status | "missing">("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    collectionApi
      .get(id)
      .then((body) => {
        if (!active) return;
        setData(body);
        setStatus("ready");
      })
      .catch((error) => active && setStatus(error?.status === 404 ? "missing" : "error"));
    return () => {
      active = false;
    };
  }, [id]);

  return { ...(data ?? { product: null, mockups: [] as CollectionMockup[] }), status };
}
