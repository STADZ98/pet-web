import axios from "axios";

const API =
  import.meta.env.VITE_API || "https://server-api-newgenz.vercel.app/api";

export const createProduct = async (token, form) => {
  return axios.post(`${API}/product`, form, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const listProduct = async (count = 20) => {
  return axios.get(`${API}/products/${count}`);
};
export const readProduct = async (token, id) => {
  return axios.get(`${API}/product/` + id, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const deleteProduct = async (token, id) => {
  return axios.delete(`${API}/product/` + id, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const updateProduct = async (token, id, form) => {
  return axios.put(`${API}/product/` + id, form, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const deleteVariant = async (token, id) => {
  return axios.delete(`${API}/variant/` + id, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const uploadFiles = async (token, form) => {
  return axios.post(
    `${API}/images`,
    {
      image: form,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
export const removeFiles = async (token, public_id) => {
  return axios.post(
    `${API}/removeimages`,
    {
      public_id,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
export const searchFilters = async (arg) => {
  return axios.post(`${API}/search/filters`, arg);
};

export const listProductBy = async (
  tokenOrSort,
  sortOrOrder,
  orderOrLimit,
  limit
) => {
  // Backwards-compatible wrapper: callers sometimes pass (sort, order, limit)
  // and sometimes (token, sort, order, limit). Detect the usage pattern.
  let token = undefined;
  let sort = sortOrOrder;
  let order = orderOrLimit;
  let lim = limit;

  // If the first argument looks like a sort key (string) and the second
  // argument is 'asc' or 'desc' (or the third arg is a number), assume
  // the caller used (sort, order, limit).
  const maybeSort = tokenOrSort;
  if (
    typeof maybeSort === "string" &&
    (sortOrOrder === "asc" ||
      sortOrOrder === "desc" ||
      typeof orderOrLimit === "number")
  ) {
    sort = maybeSort;
    order = sortOrOrder;
    lim = orderOrLimit;
    token = undefined;
  } else {
    // caller used (token, sort, order, limit)
    token = tokenOrSort;
    sort = sortOrOrder;
    order = orderOrLimit;
    lim = limit;
  }

  return axios.post(
    `${API}/productby`,
    { sort, order, limit: lim },
    token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined
  );
};

export const listProductByBrand = async (brandName) => {
  return axios.get(`${API}/products?brand=${encodeURIComponent(brandName)}`);
};
