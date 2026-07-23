const axios = require("axios");

async function mediaDownloader(url) {
  if (!url || !url.startsWith("http")) {
    throw new Error("Invalid url.");
  }

  const { data } = await axios.post(
    "https://www.mediadownloader.web.id/api/download",
    {
      url
    },
    {
      headers: {
        "content-type": "application/json",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"
      },
      timeout: 30000
    }
  );

  return data;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  try {
    const { url } = req.body || {};

    if (!url) {
      return res.status(400).json({
        error: "URL is required."
      });
    }

    const result = await mediaDownloader(url);

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({
      error:
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        "Internal server error."
    });
  }
};
