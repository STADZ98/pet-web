import axios from "axios";

const API =
  import.meta.env.VITE_API || "https://server-api-newgenz.vercel.app/api";

export const currentUser = async (token) =>
  await axios.post(
    `${API}/current-user`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

export const currentAdmin = async (token) => {
  return await axios.post(
    `${API}/current-admin`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
