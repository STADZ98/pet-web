// Home.jsx
// หน้าแรกของเว็บ petshop online แสดง carousel, index, best seller ฯลฯ
import React from "react";
import { useLoaderData, useLocation } from "react-router-dom";
import ContentCarousel from "../components/home/ContentCarousel";
import Index from "../components/home/Index";
import BestSeller from "../components/home/BestSeller";

const Home = () => {
  const loaderData = useLoaderData?.() || {};
  const location = useLocation();
  const stateData = location.state || {};

  // Prefer navigation state (prefetch from Login) if present, otherwise fall back to loader
  const bestSeller = stateData.bestSeller ?? loaderData.bestSeller ?? null;
  const newProduct = stateData.newProduct ?? loaderData.newProduct ?? null;

  return (
    <div>
      <Index initialBestSeller={bestSeller} initialNewProduct={newProduct} />
    </div>
  );
};

export default Home;
