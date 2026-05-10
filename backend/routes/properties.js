import express from 'express';
import Property from '../models/Property.js';
import Report from '../models/Report.js';
import auth from '../middleware/auth.js';
import { requireOwner } from '../middleware/roles.js';
import multer from 'multer';
import { uploadImage } from '../services/supabaseStorage.js';
import { generatePropertyDescription } from '../services/aiService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// @route   GET /api/properties
router.get('/', async (req, res) => {
  try {
    const { bounds, minPrice, maxPrice, bhkType, city, radius, lat, lng, amenities, floor } = req.query;
    let query = { status: 'approved', isActive: true };

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (bhkType && bhkType !== 'All') {
      const bhkTypesArray = bhkType.split(',');
      query.bhkType = { $in: bhkTypesArray };
    }

    if (city && city !== 'All') query.city = city;

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : amenities.split(',');
      query.amenities = { $all: amenitiesArray };
    }

    if (floor !== undefined && floor !== 'All') {
      if (floor === 'ground') query.floor = 0;
      else if (floor === '1-4') query.floor = { $gte: 1, $lte: 4 };
      else if (floor === '5-10') query.floor = { $gte: 5, $lte: 10 };
      else if (floor === '11+') query.floor = { $gte: 11 };
      else if (!isNaN(floor)) query.floor = Number(floor);
    }

    if (req.query.advancedFeatures) {
      query.advancedFeatures = { $all: req.query.advancedFeatures.split(',') };
    }

    if (req.query.filter) {
      query.allowedFor = { $in: req.query.filter.split(',') };
    }

    if (lat && lng && radius) {
      query.location = {
        $geoWithin: { $centerSphere: [[Number(lng), Number(lat)], Number(radius) / 6378.1] }
      };
    } else if (bounds) {
      const [swLng, swLat, neLng, neLat] = bounds.split(',').map(Number);
      query.location = { $geoWithin: { $box: [[swLng, swLat], [neLng, neLat]] } };
    }

    const properties = await Property.find(query).limit(100);
    res.json(properties);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/properties/mine
router.get('/mine', [auth, requireOwner], async (req, res) => {
  try {
    const properties = await Property.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/properties/:id
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('ownerId', 'name email');
    if (!property || !property.isActive) return res.status(404).json({ msg: 'Property not found' });
    res.json(property);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/properties
router.post('/', [auth, requireOwner, upload.array('images', 10)], async (req, res) => {
  try {
    const body = req.query.city ? req.query : req.body;
    const { title, description, price, bhkType, city, amenities, video, phone, whatsapp, lat, lng, allowedFor, useAI, floor, totalFloors, advancedFeatures, securityDeposit, maintenance, negotiable, sqft, foodPreference, petsAllowed, propertyType } = body;
    
    let finalDescription = description;
    if (useAI) {
      try {
        finalDescription = await generatePropertyDescription({ title, price, bhkType, amenities: JSON.parse(amenities), allowedFor: JSON.parse(allowedFor) });
      } catch (aiErr) {
        console.error('AI Fallback:', aiErr.message);
      }
    }
    
    const parseJSONField = (field, defaultVal) => {
      if (!field || field === 'undefined') return defaultVal;
      if (Array.isArray(field)) return field;
      try { return JSON.parse(field); } catch (e) { return defaultVal; }
    };

    const imageUrls = req.files && req.files.length > 0
      ? await Promise.all(req.files.map(file => uploadImage(file.buffer, file.originalname, file.mimetype)))
      : [];

    const newProperty = new Property({
      ownerId: req.user.id,
      tenantId: req.user.tenantId || null,
      title,
      description: finalDescription,
      price: Number(price),
      securityDeposit: securityDeposit ? Number(securityDeposit) : null,
      maintenance: maintenance ? Number(maintenance) : null,
      negotiable: negotiable === 'true' || negotiable === true,
      bhkType,
      city,
      amenities: parseJSONField(amenities, []),
      allowedFor: parseJSONField(allowedFor, ['Bachelors', 'Family', 'Couples']),
      video,
      phone,
      whatsapp,
      images: imageUrls,
      location: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
      floor: floor ? Number(floor) : 0,
      totalFloors: totalFloors ? Number(totalFloors) : 1,
      advancedFeatures: parseJSONField(advancedFeatures, []),
      sqft: sqft ? Number(sqft) : 0,
      foodPreference: foodPreference || 'Any',
      petsAllowed: petsAllowed === 'true' || petsAllowed === true,
      propertyType: propertyType || 'Non-Gated'
    });

    await newProperty.save();
    res.json(newProperty);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// @route   PUT /api/properties/:id
router.put('/:id', [auth, requireOwner], async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    if (property.ownerId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

    Object.assign(property, req.body);
    if (req.body.lat && req.body.lng) {
      property.location = { type: 'Point', coordinates: [Number(req.body.lng), Number(req.body.lat)] };
    }

    await property.save();
    res.json(property);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/properties/:id
router.delete('/:id', [auth, requireOwner], async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    if (property.ownerId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });
    await Property.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Property removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/properties/:id/report
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, details } = req.body;
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });

    const newReport = new Report({ propertyId: req.params.id, reporterId: req.user.id, reason, details });
    await newReport.save();
    res.json({ msg: 'Report submitted successfully' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

export default router;
