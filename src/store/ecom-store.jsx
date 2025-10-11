import axios from "axios";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { listCategory } from "../api/category";
import { listProductBy, searchFilters } from "../api/product";
import { listBrand } from "../api/brand";

const API =
  import.meta.env.VITE_API || "https://server-api-newgen.vercel.app/api";

// 🎯 initial state
const initialState = {
  user: null,
  token: null,
  profile: null,
  loadingProfile: false,
  profileRequestInFlight: false,

  categories: [],
  subcategories: [],
  subsubcategories: [],
  brands: [],
  products: [],
  // simple in-memory cache for product lists to avoid refetching
  _productsCache: {},

  carts: [],
  orders: [],
  isCartSidebarOpen: false,

  filters: {
    query: "",
    category: [],
    subcategory: [],
    subsubcategory: [],
    price: [0, 172000],
    brand: null,
  },
};

// 🎯 Store
const ecomStore = (set, get) => ({
  ...initialState,

  // -------------------- AUTH --------------------
  actionLogin: async (form) => {
    try {
      const res = await axios.post(`${API}/login`, form);
      const payload = res.data.payload;
      const token = res.data.token;
      const profile = res.data.profile || payload; // ใช้ profile จาก backend

      set({ user: payload, token, profile });
      return res;
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  },

  logout: () => set(initialState),

  fetchProfile: async () => {
    if (get().profileRequestInFlight || !get().token) return;
    set({ loadingProfile: true, profileRequestInFlight: true });

    try {
      const res = await axios.get(`${API}/admin/profile`, {
        headers: { Authorization: `Bearer ${get().token}` },
      });
      set({
        profile: res.data,
        loadingProfile: false,
        profileRequestInFlight: false,
      });
    } catch (err) {
      set({ loadingProfile: false, profileRequestInFlight: false });
      console.error("Error fetching profile:", err);
    }
  },

  // -------------------- ORDER --------------------
  fetchOrders: async () => {
    try {
      const token = get().token;
      if (!token) return set({ orders: [] });

      const res = await axios.get(`${API}/user/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ orders: res.data });
    } catch (err) {
      console.error("Error fetching orders:", err);
      set({ orders: [] });
    }
  },

  // -------------------- PRODUCT & FILTER --------------------
  getProduct: async (...args) => {
    try {
      let token = get().token || null; // ใช้ token จาก store ถ้าไม่มี
      let sort = "createdAt";
      let order = "desc";
      let limit = 50;

      if (args.length === 1) {
        if (typeof args[0] === "string") token = args[0];
        else if (typeof args[0] === "number") limit = args[0];
      } else if (args.length === 2) {
        if (typeof args[0] === "string" && typeof args[1] === "number") {
          token = args[0];
          limit = args[1];
        } else if (typeof args[0] === "string" && typeof args[1] === "string") {
          sort = args[0];
          order = args[1];
        }
      } else if (args.length >= 3) {
        sort = args[0] ?? sort;
        order = args[1] ?? order;
        limit = args[2] ?? limit;
      }

      // build cache key based on token (or empty), sort, order, limit
      const cacheKey = `${token || "anon"}:${sort}:${order}:${limit}`;

      // return cached if available
      const cache = get()._productsCache || {};
      if (cache[cacheKey]) {
        set({ products: cache[cacheKey] });
        return cache[cacheKey];
      }

      const res = await listProductBy(token, sort, order, limit);
      const productsData = res.data || [];
      // save to cache
      set((state) => ({
        products: productsData,
        _productsCache: {
          ...(state._productsCache || {}),
          [cacheKey]: productsData,
        },
      }));
      return productsData;
    } catch (err) {
      console.error("getProduct error:", err.response?.data || err.message);
      set({ products: [] });
    }
  },

  // fetchProducts: similar to getProduct but doesn't mutate global `products` state
  fetchProducts: async (...args) => {
    try {
      let token = get().token || null;
      let sort = "createdAt";
      let order = "desc";
      let limit = 50;

      if (args.length === 1) {
        if (typeof args[0] === "string") token = args[0];
        else if (typeof args[0] === "number") limit = args[0];
      } else if (args.length === 2) {
        if (typeof args[0] === "string" && typeof args[1] === "number") {
          token = args[0];
          limit = args[1];
        } else if (typeof args[0] === "string" && typeof args[1] === "string") {
          sort = args[0];
          order = args[1];
        }
      } else if (args.length >= 3) {
        sort = args[0] ?? sort;
        order = args[1] ?? order;
        limit = args[2] ?? limit;
      }

      const cacheKey = `${token || "anon"}:${sort}:${order}:${limit}`;
      const cache = get()._productsCache || {};
      if (cache[cacheKey]) {
        return cache[cacheKey];
      }

      const res = await listProductBy(token, sort, order, limit);
      const productsData = res.data || [];
      // save to cache only
      set((state) => ({
        _productsCache: {
          ...(state._productsCache || {}),
          [cacheKey]: productsData,
        },
      }));
      return productsData;
    } catch (err) {
      console.error("fetchProducts error:", err.response?.data || err.message);
      return [];
    }
  },

  // clear entire products cache
  clearProductsCache: () => {
    set({ _productsCache: {} });
  },

  // invalidate a specific cache entry by key parts
  invalidateProductsCacheKey: ({
    token = null,
    sort = "createdAt",
    order = "desc",
    limit = 50,
  } = {}) => {
    const cacheKey = `${token || "anon"}:${sort}:${order}:${limit}`;
    const cache = get()._productsCache || {};
    if (cache[cacheKey]) {
      const newCache = { ...cache };
      delete newCache[cacheKey];
      set({ _productsCache: newCache });
    }
  },

  actionSearchFilters: async (args) => {
    try {
      const filters = {
        ...get().filters,
        ...args,
        subsubcategory: args?.subsubcategory ?? [],
      };
      set({ filters });
      const res = await searchFilters(filters);
      set({ products: res.data || [] });
    } catch (err) {
      console.error("Error applying filters:", err);
    }
  },

  // -------------------- CATEGORY / BRAND --------------------
  getCategory: async () => {
    try {
      const res = await listCategory();
      set({ categories: res.data });
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  },

  getBrands: async () => {
    try {
      const res = await listBrand();
      set({ brands: res.data });
    } catch (err) {
      console.error("Error fetching brands:", err);
    }
  },

  getSubcategories: async () => {
    try {
      const res = await axios.get(`${API}/subcategory`);
      set({ subcategories: res.data });
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      set({ subcategories: [] });
    }
  },

  getSubsubcategories: async () => {
    try {
      const res = await axios.get(`${API}/subsubcategory`);
      set({ subsubcategories: res.data });
    } catch (err) {
      console.error("Error fetching subsubcategories:", err);
      set({ subsubcategories: [] });
    }
  },

  // -------------------- CART --------------------
  actionAddtoCart: (product, quantity = 1) => {
    const carts = get().carts || [];
    const variantId = product.variantId ?? null;

    let itemPrice = product.price;
    let images = [];
    let variantTitle = product.variantTitle ?? null;

    if (variantId && Array.isArray(product.variants)) {
      const found = product.variants.find(
        (v) => String(v.id) === String(variantId)
      );
      if (found) {
        itemPrice = found.price ?? itemPrice;
        images =
          found.images?.length > 0
            ? found.images
                .map((img) => (typeof img === "string" ? img : img.url))
                .filter(Boolean)
            : (product.images || [])
                .map((img) => (typeof img === "string" ? img : img.url))
                .filter(Boolean);
        variantTitle = found.title || variantTitle;
      }
    } else {
      images = (product.images || [])
        .map((img) => (typeof img === "string" ? img : img.url))
        .filter(Boolean);
    }

    const exist = carts.find(
      (item) => item.id === product.id && (item.variantId ?? null) === variantId
    );

    if (exist) {
      set({
        carts: carts.map((item) =>
          item.id === product.id && (item.variantId ?? null) === variantId
            ? { ...item, count: (item.count || 0) + quantity }
            : item
        ),
      });
    } else {
      const cartItem = {
        id: product.id,
        title: variantTitle
          ? `${product.title} - ${variantTitle}`
          : product.title,
        price: itemPrice,
        count: quantity,
        variantId,
        variantTitle: variantTitle ?? null,
        images,
        product,
      };
      set({ carts: [...carts, cartItem] });
    }
  },

  setCartSidebarOpen: (val) => set({ isCartSidebarOpen: !!val }),
  actionOpenCartSidebar: () => set({ isCartSidebarOpen: true }),
  actionCloseCartSidebar: () => set({ isCartSidebarOpen: false }),

  actionUpdateQuantity: (productId, newQuantity, variantId = null) => {
    set((state) => ({
      carts: state.carts.map((item) => {
        const itemVariant = item.variantId ?? null;
        if (
          item.id === productId &&
          (variantId === null || itemVariant === variantId)
        ) {
          return { ...item, count: Math.max(1, newQuantity) };
        }
        return item;
      }),
    }));
  },

  actionRemoveProduct: (productId, variantId = null) => {
    set((state) => ({
      carts: state.carts.filter((item) => {
        const itemVariant = item.variantId ?? null;
        if (item.id !== productId) return true;
        if (variantId === null) return false;
        return itemVariant !== variantId;
      }),
    }));
  },

  clearCart: () => set({ carts: [] }),

  getTotalPrice: () =>
    get().carts.reduce(
      (total, item) => total + (item.price || 0) * (item.count || 0),
      0
    ),
});

// -------------------- Persist --------------------
const usePersist = {
  name: "PetShopOnline",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    user: state.user,
    token: state.token,
    profile: state.profile,
    carts: (state.carts || []).map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      count: item.count,
      variantId: item.variantId,
      variantTitle: item.variantTitle,
      images: item.images,
    })),
    filters: state.filters,
  }),
};

const useEcomStore = create(persist(ecomStore, usePersist));
export default useEcomStore;
