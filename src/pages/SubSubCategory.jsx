import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import useEcomStore from "../store/ecom-store";
import SidebarFilter from "../components/card/SidebarFilter";
import { getCategoryName } from "../utils/categoryUtils";
import { listProductBySubsubcategory } from "../api/product";

const getCategoryOrSubCategoryImage = (item) =>
  (item && (item.images || item.image)) || "/img/default-category.png";

const LoadingSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
    <div className="h-40 bg-gray-200 rounded-xl mb-4 w-full" />
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-3 bg-gray-200 rounded w-1/3" />
  </div>
);

const Card = ({ name, image, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
  >
    <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
      <img
        src={image}
        alt={name}
        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/img/default-category.png";
        }}
      />
    </div>
    <div className="p-4 text-center">
      <h3 className="text-lg font-semibold text-gray-800 truncate">{name}</h3>
    </div>
  </button>
);

const SubSubCategory = () => {
  const categories = useEcomStore((s) => s.categories || []);
  const subcategories = useEcomStore((s) => s.subcategories || []);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular");

  const subcategoryParam = searchParams.get("subcategory") || "";

  const subcategory = useMemo(() => {
    return (
      subcategories.find((s) => {
        const name = getCategoryName(s) || "";
        return (
          name === subcategoryParam ||
          String(s.id) === subcategoryParam ||
          String(s._id) === subcategoryParam
        );
      }) || null
    );
  }, [subcategories, subcategoryParam]);

  const allSubSubcategories = useMemo(
    () => subcategories.flatMap((s) => s.subsubcategories || []),
    [subcategories]
  );

  const filteredSubSubcategories = useMemo(() => {
    if (!subcategory) return [];
    return allSubSubcategories.filter(
      (subsub) =>
        String(subsub.subcategoryId) === String(subcategory.id) ||
        String(subsub.subcategoryId) === String(subcategory._id)
    );
  }, [allSubSubcategories, subcategory]);

  const visibleSubSubcategories = useMemo(() => {
    const list = (filteredSubSubcategories || []).map((s) => ({
      ...s,
      __image: getCategoryOrSubCategoryImage(s),
    }));
    let filtered = list.filter((s) =>
      (s.name || "").toLowerCase().includes((searchTerm || "").toLowerCase())
    );
    if (sortBy === "alpha")
      filtered.sort((a, b) =>
        a.name.localeCompare(b.name, "th", { sensitivity: "base" })
      );
    return filtered;
  }, [filteredSubSubcategories, searchTerm, sortBy]);

  const [page, setPage] = useState(1);
  const pageSize = 12;

  const paginatedVisible = useMemo(() => {
    const start = (page - 1) * pageSize;
    return visibleSubSubcategories.slice(start, start + pageSize);
  }, [visibleSubSubcategories, page]);

  const [subsubPreviews, setSubsubPreviews] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const toFetch = paginatedVisible.slice(0, 6);
        await Promise.all(
          toFetch.map(async (s) => {
            try {
              const res = await listProductBySubsubcategory(s._id || s.id);
              if (!mounted) return;
              setSubsubPreviews((p) => ({
                ...p,
                [s._id || s.id]: (res.data || []).slice(0, 3),
              }));
            } catch (e) {
              // ignore
            }
          })
        );
      } finally {
        // noop
      }
    })();
    return () => {
      mounted = false;
    };
  }, [paginatedVisible]);

  const subsubCount = filteredSubSubcategories.length;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white min-h-screen font-sarabun flex flex-col">
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 bg-white/80 backdrop-blur-md rounded-xl p-8 shadow-md">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                {subcategory
                  ? `หมวดหมู่ ${
                      getCategoryName(subcategory) || subcategory.name
                    }`
                  : "สำรวจหมวดหมู่ย่อย"}
              </h1>
              <p className="text-gray-600 text-base md:text-lg mb-6">
                {subcategory
                  ? `ดูรายการหมวดหมู่ย่อยระดับ 2 ภายใต้ "${
                      getCategoryName(subcategory) || subcategory.name
                    }"`
                  : "เรียกดูหมวดหมู่ย่อยระดับ 2 ที่มีให้เลือก"}
              </p>
            </div>
            <div className="md:col-span-1">
              <div className="rounded-xl overflow-hidden shadow-lg bg-white">
                <div className="h-48 md:h-56 w-full bg-gray-100 flex items-center justify-center">
                  {subcategory ? (
                    <img
                      src={getCategoryOrSubCategoryImage(subcategory)}
                      alt={getCategoryName(subcategory)}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="text-center p-6">
                      <p className="text-sm text-gray-500 mt-2">รูปตัวอย่าง</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label="Breadcrumb"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-3 shadow-sm border border-gray-100">
          <ol className="flex items-center space-x-3 text-sm text-gray-600">
            <li>
              <Link
                to="/"
                className="inline-flex items-center text-gray-600 hover:text-gray-800"
              >
                <svg
                  className="w-4 h-4 mr-2 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 9.75L12 4l9 5.75V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.75z"
                  />
                </svg>
                หน้าหลัก
              </Link>
            </li>
            <li className="text-gray-300">/</li>
            <li>
              <Link
                to="/shop"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                สินค้า
              </Link>
            </li>
            {subcategory && (
              <>
                <li className="text-gray-300">/</li>
                <li
                  aria-current="page"
                  className="text-gray-900 font-semibold truncate max-w-xs"
                >
                  {getCategoryName(subcategory) || subcategory.name}
                </li>
              </>
            )}
          </ol>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 py-10 px-4 md:px-6 flex-1 w-full">
        <aside className="w-full md:w-72 mb-8 md:mb-0">
          <div className="sticky top-28">
            <SidebarFilter />
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
              <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 w-full md:w-80 shadow-sm">
                <input
                  aria-label="ค้นหาหมวดหมู่ย่อย"
                  placeholder="ค้นหาหมวดหมู่ย่อย..."
                  className="bg-transparent outline-none text-sm text-gray-700 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  id="sort"
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 shadow-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="popular">ยอดนิยม</option>
                  <option value="alpha">ชื่อ (A–Z)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedVisible.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <LoadingSkeleton key={i} />
                  ))
                : paginatedVisible.map((subsub) => (
                    <div key={subsub._id || subsub.id}>
                      <Card
                        name={subsub.name}
                        image={subsub.__image}
                        onClick={() =>
                          navigate(
                            `/shop/productListingPage?subsubcategory=${encodeURIComponent(
                              subsub.name
                            )}`
                          )
                        }
                      />
                      <div className="mt-2 flex items-center gap-2 justify-center">
                        {(subsubPreviews[subsub._id || subsub.id] || [])
                          .slice(0, 3)
                          .map((p) => (
                            <img
                              key={p.id}
                              src={p.image || "/img/no-image.png"}
                              alt={p.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ))}
                      </div>
                    </div>
                  ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                className="px-3 py-2 bg-white border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ก่อนหน้า
              </button>
              <span className="text-sm text-gray-600">หน้า {page}</span>
              <button
                className="px-3 py-2 bg-white border rounded disabled:opacity-50"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * pageSize >= visibleSubSubcategories.length}
              >
                ถัดไป
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SubSubCategory;
