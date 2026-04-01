const express = require('express');
const Property = require('../models/Property');
const { authMiddleware, ownerMiddleware } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');
const upload = require('../middleware/upload');

const router = express.Router();

// Get properties (public, map bounds query)
router.get('/', async (req, res) => {
  try {
    const { 
      minRent, maxRent, bhkType, 
      ne_lat, ne_lng, sw_lat, sw_lng, // bounds: ne=NorthEast, sw=SouthWest
      status = 'approved', limit = 50 
    } = req.query;

    let match = { status };

    if (minRent || maxRent) {
      match.rent = {};
      if (minRent) match.rent.$gte = parseFloat(minRent);
      if (maxRent) match.rent.$lte = parseFloat(maxRent);
    }

    if (bhkType) match.bhkType = bhkType;

    let pipeline = [{ $match: match }];

    // Map bounds filter using geoWithin
    if (ne_lat && ne_lng && sw_lat && sw_lng) {
      const bounds = {
        $geometry: {
          type: 'Polygon',
          coordinates: [[
            [parseFloat(sw_lng), parseFloat(sw_lat)],
            [parseFloat(ne_lng), parseFloat(sw_lat)],
            [parseFloat(ne_lng), parseFloat(ne_lat)],
            [parseFloat(sw_lng), parseFloat(ne_lat)],
            [parseFloat(sw_lng), parseFloat(sw_lat)]
          ]]
        }
      };
      pipeline.unshift({
        $geoNear: {
          near: { type: 'Point', coordinates: [0, 0] },
          distanceField: 'dist.calculated',
          maxDistance: 10000000, // 10km default max
          spherical: true,
          query: { location: { $geoWithin: bounds } }
        }
      });
    }

    pipeline.push(
      { $lookup: { from: 'users', localField: 'ownerId', foreignField: '_id', as: 'owner', pipeline: [{ $project: { name: 1, phone: 1 } }] } },
      { $addFields: { owner: { $arrayElemAt: ['$owner', 0] } } },
      { $sort: { createdAt: -1 } },
      { $limit: parseInt(limit) },
      { $project: { dist: 0 } }
    );

    const properties = await Property.aggregate(pipeline);
    res.json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single property
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('ownerId', 'name phone');
    if (!property) return res.status(404).json({ error: 'Property not found' });
    
    property.views += 1;
    await property.save();
    
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create property (owner only)
router.post('/', [authMiddleware, ownerMiddleware], upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), [
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('rent').isFloat({ min: 0 }),
  body('bhkType').isIn(['1BHK', '2BHK', '3BHK', '4BHK', '5BHK+', 'Studio', 'PG']),
  body('phone').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

// Role check moved to ownerMiddleware

    const location = {
      type: 'Point',
      coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)]
    };

    const property = new Property({
      ...req.body,
      ownerId: req.user._id,
      location,
      images: req.files?.images?.map(f => `/uploads/${f.filename}`) || [],
      video: req.files?.video ? `/uploads/${req.files.video[0].filename}` : null
    });

    await property.save();
    const populated = await Property.findById(property._id).populate('ownerId', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update property (owner only)
router.put('/:id', [authMiddleware, ownerMiddleware], async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!property) return res.status(404).json({ error: 'Property not found' });

    Object.assign(property, req.body);
    await property.save();
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete property (owner only)
router.delete('/:id', [authMiddleware, ownerMiddleware], async (req, res) => {
  try {
    const property = await Property.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json({ message: 'Property deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

