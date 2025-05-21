import axios from "axios";
import express from "express";

const router = express.Router();

router.post("/test-api", async (req, res) => {
  const { method, url, headers, body } = req.body;

  // Validate the request
  if (!method || !url) {
    return res.status(400).json({ error: "Method and URL are required." });
  }

  try {
    // Send the API request using axios
    const response = await axios({
      method,
      url,
      headers: headers.reduce((acc: Record<string, string>, header: { key: string; value: string }) => {
        if (header.key) acc[header.key] = header.value;
        return acc;
      }, {}),
      data: body,
    });

    // Return the response to the frontend
    res.json({
      status: response.status,
      headers: response.headers,
      body: response.data,
    });
  } catch (error) {
    // Handle errors gracefully
    if (axios.isAxiosError(error) && error.response) {
      res.json({
        status: error.response.status,
        headers: error.response.headers,
        body: error.response.data,
      });
    } else {
      res.status(500).json({ error: "Failed to send API request." });
    }
  }
});

export default router;