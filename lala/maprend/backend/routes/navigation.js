const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { from_lat, from_lng, to_lat, to_lng, mode = 'driving' } = req.query;
    
    if (!from_lat || !from_lng || !to_lat || !to_lng) {
      return res.status(400).json({ error: 'Missing coordinates' });
    }

    const url = `https://api.openrouteservice.org/v2/directions/${mode}`;
    const response = await axios.post(url, {
      coordinates: [
        [parseFloat(from_lng), parseFloat(from_lat)],
        [parseFloat(to_lng), parseFloat(to_lat)]
      ]
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      distance: response.data.routes[0].summary.distance / 1000, // km
      duration: response.data.routes[0].summary.duration / 60, // minutes
      geometry: response.data.routes[0].geometry,
      bbox: response.data.routes[0].bbox
    });
  } catch (error) {
    console.error('Navigation API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Navigation service unavailable' });
  }
});

module.exports = router;

