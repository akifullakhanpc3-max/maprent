const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const { requireOwner } = require('../middleware/roles');
const multer = require('multer');

const { uploadImage } = require('../services/supabaseStorage');

// Use memory storage — files are held in RAM as buffers, then streamed to Supabase
const upload = multer({ storage: multer.memoryStorage() });


// @route   GET /api/properties
// @desc    Get all properties within map bounds
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { bounds, minPrice, maxPrice, bhkType, city, radius, lat, lng, amenities, floor } = req.query;

    let query = { status: 'approved', isActive: true };

    // Basic filters
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (bhkType && bhkType !== 'All') {
      const bhkTypesArray = bhkType.split(',');
      query.bhkType = { $in: bhkTypesArray };
    }

    if (city && city !== 'All') {
      query.city = city;
    }

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : amenities.split(',');
      query.amenities = { $all: amenitiesArray };
    }

    if (floor !== undefined && floor !== 'All') {
      if (floor === 'ground') {
        query.floor = 0;
      } else if (floor === '1-4') {
        query.floor = { $gte: 1, $lte: 4 };
      } else if (floor === '5-10') {
        query.floor = { $gte: 5, $lte: 10 };
      } else if (floor === '11+') {
        query.floor = { $gte: 11 };
      } else if (!isNaN(floor)) {
        query.floor = Number(floor);
      }
    }

    if (req.query.advancedFeatures) {
      const advancedArray = req.query.advancedFeatures.split(',');
      query.advancedFeatures = { $all: advancedArray };
    }

    if (req.query.filter) {
      const allowedForArray = req.query.filter.split(',');
      query.allowedFor = { $in: allowedForArray };
    }

    // Geospatial Priority: Radius > Bounds
    if (lat && lng && radius) {
      // radius is in km, $centerSphere wants radians (radius / 6378.1)
      query.location = {
        $geoWithin: {
          $centerSphere: [[Number(lng), Number(lat)], Number(radius) / 6378.1]
        }
      };
    } else if (bounds) {
      // bounds format: sw_lng,sw_lat,ne_lng,ne_lat
      const [swLng, swLat, neLng, neLat] = bounds.split(',').map(Number);
      
      query.location = {
        $geoWithin: {
          $box: [
            [swLng, swLat], // bottom left
            [neLng, neLat]  // top right
          ]
        }
      };
    }

    const properties = await Property.find(query).limit(100); // limit to 100 markers for performance
    res.json(properties);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/properties/mine
// @desc    Get user's uploaded properties
// @access  Private (Owner)
router.get('/mine', [auth, requireOwner], async (req, res) => {
  try {
    const properties = await Property.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/properties/:id
// @desc    Get single property by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('ownerId', 'name email');
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    
    // Check if property is active (or if it belongs to the requester)
    if (!property.isActive) {
      return res.status(404).json({ msg: 'Property is currently delisted' });
    }

    res.json(property);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Property not found' });
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/properties
// @desc    Create a new property
// @access  Private (Owner)
const aiService = require('../services/aiService');

router.post('/', [auth, requireOwner, upload.array('images', 10)], async (req, res) => {
  try {
    const { title, description, price, bhkType, city, amenities, video, phone, whatsapp, lat, lng, allowedFor, useAI, floor, totalFloors, advancedFeatures, securityDeposit, maintenance, negotiable, sqft, foodPreference, petsAllowed, propertyType } = req.query.city ? req.query : req.body;
    
    let finalDescription = description;
    if (useAI) {
      try {
        finalDescription = await aiService.generatePropertyDescription({ title, price, bhkType, amenities: JSON.parse(amenities), allowedFor: JSON.parse(allowedFor) });
      } catch (aiErr) {
        console.error('AI Description failed, falling back to user description:', aiErr.message);
      }
    }
    
    const parseJSONField = (field, defaultVal) => {
      if (!field || field === 'undefined') return defaultVal;
      if (Array.isArray(field)) return field;
      try {
        return JSON.parse(field);
      } catch (e) {
        console.error('Error parsing field:', field, e);
        return defaultVal;
      }
    };

    const parsedAmenities = parseJSONField(amenities, []);
    const parsedAllowedFor = parseJSONField(allowedFor, ['Bachelors', 'Family', 'Couples']);
    const parsedAdvancedFeatures = parseJSONField(advancedFeatures, []);

    // Upload all images to Supabase Storage in parallel
    const imageUrls = req.files && req.files.length > 0
      ? await Promise.all(
          req.files.map(file => uploadImage(file.buffer, file.originalname, file.mimetype))
        )
      : [];

    const newProperty = new Property({
      ownerId: req.user.id,
      tenantId: req.user.tenantId || null,
      title,
      description: finalDescription,
      price: Number(price),
      securityDeposit: (securityDeposit !== undefined && securityDeposit !== '') ? Number(securityDeposit) : null,
      maintenance: (maintenance !== undefined && maintenance !== '') ? Number(maintenance) : null,
      negotiable: negotiable === 'true' || negotiable === true,
      bhkType,
      city,
      amenities: parsedAmenities,
      allowedFor: parsedAllowedFor,
      video,
      phone,
      whatsapp,
      images: imageUrls,
      location: {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      },
      floor: floor ? Number(floor) : 0,
      totalFloors: totalFloors ? Number(totalFloors) : 1,
      advancedFeatures: parsedAdvancedFeatures,
      sqft: sqft ? Number(sqft) : 0,
      foodPreference: foodPreference || 'Any',
      petsAllowed: petsAllowed === 'true' || petsAllowed === true,
      propertyType: propertyType || 'Non-Gated'
    });

    const property = await newProperty.save();
    res.json(property);
  } catch (err) {
    console.error('Property creation error:', err);
    res.status(500).json({ msg: err.message || 'Server Error' });
  }
});

// @route   PUT /api/properties/:id
// @desc    Update a property
// @access  Private (Owner)
router.put('/:id', [auth, requireOwner], async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });

    if (property.ownerId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const { title, description, price, bhkType, phone, whatsapp, isActive, lat, lng, floor, totalFloors, advancedFeatures, securityDeposit, maintenance, negotiable } = req.body;
    
    if (title) property.title = title;
    if (description) property.description = description;
    if (price) property.price = Number(price);
    if (securityDeposit !== undefined) property.securityDeposit = (securityDeposit !== '') ? Number(securityDeposit) : null;
    if (maintenance !== undefined) property.maintenance = (maintenance !== '') ? Number(maintenance) : null;
    if (negotiable !== undefined) property.negotiable = negotiable === 'true' || negotiable === true;
    if (bhkType) property.bhkType = bhkType;
    if (phone) property.phone = phone;
    if (whatsapp) property.whatsapp = whatsapp;
    if (isActive !== undefined) property.isActive = isActive;
    if (floor !== undefined) property.floor = Number(floor);
    if (totalFloors !== undefined) property.totalFloors = Number(totalFloors);
    if (advancedFeatures) property.advancedFeatures = advancedFeatures;

    if (lat !== undefined && lng !== undefined) {
      property.location = {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      };
    }

    await property.save();
    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/properties/:id
// @desc    Delete a property
// @access  Private (Owner)
router.delete('/:id', [auth, requireOwner], async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ msg: 'Property not found' });
    }

    // Check user
    if (property.ownerId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Property removed' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Property not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/properties/:id/report
// @desc    Report a property
// @access  Private
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, details } = req.body;
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });

    const newReport = new Report({
      propertyId: req.params.id,
      reporterId: req.user.id,
      reason,
      details
    });

    await newReport.save();
    res.json({ msg: 'Report submitted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
