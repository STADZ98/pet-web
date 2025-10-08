// Home.jsx
// หน้าแรกของเว็บ petshop online แสดง carousel, index, best seller ฯลฯ
import React from "react";
import { useLoaderData } from "react-router-dom";
import ContentCarousel from "../components/home/ContentCarousel";
import Index from "../components/home/Index";
import BestSeller from "../components/home/BestSeller";

const Home = () => {
  const loaderData = useLoaderData?.() || {};
  const { bestSeller = [], newProduct = [] } = loaderData;

  return (
    <div>
      <Index initialBestSeller={bestSeller} initialNewProduct={newProduct} />
    </div>
  );
};

export default Home;
