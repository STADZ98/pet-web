import React, { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Lazy-loaded pages (reduces initial bundle)
const Home = lazy(() => import("../pages/Home"));
const Shop = lazy(() => import("../pages/Shop"));
const Cart = lazy(() => import("../pages/Cart"));
const History = lazy(() => import("../pages/user/History"));
const Success = lazy(() => import("../pages/user/Success"));
const Checkout = lazy(() => import("../pages/Checkout"));
const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("../pages/auth/Register"));

const Layout = lazy(() => import("../layouts/Layout"));
const LayoutAdmin = lazy(() => import("../layouts/LayoutAdmin"));
const LayoutUser = lazy(() => import("../layouts/LayoutUser"));

// Admin Pages
const Dashbord = lazy(() => import("../pages/admin/Dashboard"));
const Category = lazy(() => import("../pages/admin/Category"));
const SubCategoryPage = lazy(() => import("../pages/admin/SubCategoryPage"));
const SubSubCategoryPage = lazy(() =>
  import("../pages/admin/SubSubCategoryPage")
);
const Product = lazy(() => import("../pages/admin/Product"));
const EditProduct = lazy(() => import("../pages/admin/EditProduct"));
const Manage = lazy(() => import("../pages/admin/Manage"));
const ManageOrders = lazy(() => import("../pages/admin/ManageOrders"));
const FormSubcategory = lazy(() =>
  import("../components/admin/FormSubcategory")
);

// User Pages
const HomeUser = lazy(() => import("../pages/user/HomeUser"));
const Payment = lazy(() => import("../pages/user/Payment"));
const Profile = lazy(() => import("../pages/user/Profile"));

// Product Detail Page
const ProductDetail = lazy(() => import("../pages/ProductDetail"));

// Category Page
const CategoryPage = lazy(() => import("../pages/CategoryPage"));

// Protected Routes
const ProtectRouteAdmin = lazy(() => import("./ProtecRouteAdmin"));
const ProtectRouteUser = lazy(() => import("./ProtectRouteUser"));

const SubCategory = lazy(() => import("../pages/SubCategory"));
const SubSubCategory = lazy(() => import("../pages/SubSubCategory"));
const ProductListingPage = lazy(() => import("../pages/ProductListingPage"));
const BrandPage = lazy(() => import("../pages/BrandPage"));

const ArticleDetail = lazy(() => import("../components/article/ArticleDetail"));
const ArticleDetail2 = lazy(() =>
  import("../components/article/ArticleDetail2")
);
const ArticleDetail3 = lazy(() =>
  import("../components/article/ArticleDetail3")
);
const ArticleDetail4 = lazy(() =>
  import("../components/article/ArticleDetail4")
);
const ArticleDetail5 = lazy(() =>
  import("../components/article/ArticleDetail5")
);
const ArticleDetail6 = lazy(() =>
  import("../components/article/ArticleDetail6")
);
const Articles = lazy(() => import("../pages/Articles"));
const About = lazy(() => import("../pages/About"));
const Contact = lazy(() => import("../pages/Contact"));
const Track = lazy(() => import("../pages/Track"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "shop", element: <Shop /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },

      { path: "category/:id", element: <CategoryPage /> },
      { path: "category", element: <CategoryPage /> },
      { path: "/product/:id", element: <ProductDetail /> },
      { path: "shop/subcategory", element: <SubCategory /> },
      { path: "shop/subsubcategory", element: <SubSubCategory /> },
      { path: "shop/productListingPage", element: <ProductListingPage /> },
      { path: "shop/brand", element: <BrandPage /> },

      { path: "article/1", element: <ArticleDetail /> },
      { path: "article/2", element: <ArticleDetail2 /> },
      { path: "article/3", element: <ArticleDetail3 /> },
      { path: "article/4", element: <ArticleDetail4 /> },
      { path: "article/5", element: <ArticleDetail5 /> },
      { path: "article/6", element: <ArticleDetail6 /> },
      { path: "articles", element: <Articles /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
      { path: "track", element: <Track /> },
    ],
  },
  {
    path: "/admin",
    element: <ProtectRouteAdmin element={<LayoutAdmin />} />,
    children: [
      { index: true, element: <Dashbord /> },
      { path: "category", element: <Category /> },
      { path: "category/sub", element: <SubCategoryPage /> },
      { path: "category/subsub", element: <SubSubCategoryPage /> },
      { path: "product", element: <Product /> },
      { path: "product/:id", element: <EditProduct /> },
      { path: "manage", element: <Manage /> },
      { path: "orders", element: <ManageOrders /> },
      { path: "subcategory", element: <FormSubcategory /> },
    ],
  },
  {
    path: "/user",
    element: <ProtectRouteUser element={<LayoutUser />} />,
    children: [
      { index: true, element: <HomeUser /> },
      { path: "payment", element: <Payment /> },
      { path: "history", element: <History /> },
      { path: "success", element: <Success /> },
      { path: "profile", element: <Profile /> },
    ],
  },
]);

const AppRoutes = () => {
  return (
    <Suspense fallback={<div />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default AppRoutes;
