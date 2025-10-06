import axios from "axios";

const API =
  import.meta.env.VITE_API || "https://server-api-newgenz.vercel.app/api";

export const payment = async (token, method = undefined) =>
  await axios.post(
    `${API}/user/create-payment-intent`,
    { method },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
