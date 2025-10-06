import axios from "axios";

const API =
  import.meta.env.VITE_API || "https://server-api-newgenz.vercel.app/api";

export const trackShipment = (carrier, tracking) => {
  return axios.post(
    `${API}/shipping/track`,
    { carrier, tracking },
    { headers: { "Content-Type": "application/json" } }
  );
};
