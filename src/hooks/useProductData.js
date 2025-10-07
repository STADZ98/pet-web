import { useState, useEffect } from "react";
import { listProductBy } from "../api/product";
import { useEcomStore } from "../store/ecomStore";
import { productCache } from "../utils/cache";

export const useProductData = () => {
  const [productState, setProductState] = useState({
    bestSeller: [],
    newProduct: [],
    loading: true,
    error: null,
  });

  // Global stores
  const categories = useEcomStore((s) => s.categories || []);
  const subcategories = useEcomStore((s) => s.subcategories || []);
  const brands = useEcomStore((s) => s.brands || []);
  const getCategory = useEcomStore((s) => s.getCategory);

  useEffect(() => {
    let ignore = false;

    const fetchProductData = async () => {
      try {
        // Check cache first
        const cachedData = productCache.get("homeProducts");
        if (cachedData) {
          setProductState({
            ...cachedData,
            loading: false,
            error: null,
          });
          return;
        }

        // If no cache, fetch data in parallel
        const [bestSellerRes, newProductRes] = await Promise.all([
          listProductBy("sold", "desc", 10),
          listProductBy("updatedAt", "desc", 10),
        ]);

        if (!ignore) {
          const newData = {
            bestSeller: bestSellerRes.data || [],
            newProduct: newProductRes.data || [],
          };

          // Cache the new data
          productCache.set("homeProducts", newData);

          setProductState({
            ...newData,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
        if (!ignore) {
          setProductState((prev) => ({
            ...prev,
            loading: false,
            error: "Failed to load products",
          }));
        }
      }
    };

    fetchProductData();
    return () => {
      ignore = true;
    };
  }, []);

  return {
    ...productState,
    categories,
    subcategories,
    brands,
    getCategory,
  };
};
