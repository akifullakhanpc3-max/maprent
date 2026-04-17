const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const auth = require('../middleware/auth');
const { requireOwner } = require('../middleware/roles');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Cloudinary if keys exist, else fallback to Local
let storage;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'occupra_properties',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, crop: 'limit' }]
    }
  });
} else {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
}

const upload = multer({ storage: storage });

// @route   GET /api/properties
// @desc    Get all properties within map bounds
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { bounds, minPrice, maxPrice, bhkType, city, radius, lat, lng, amenities, floor } = req.query;

    let query = { status: 'approved' };

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
    const { title, description, price, bhkType, city, amenities, video, phone, whatsapp, lat, lng, allowedFor, useAI, floor, totalFloors, advancedFeatures } = req.query.city ? req.query : req.body;
    
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

    const imageUrls = req.files ? req.files.map(file => {
      // If Cloudinary handled it, file.path is a full HTTPS URL
      if (file.path && file.path.startsWith('http')) return file.path;
      // Otherwise fallback to local uploads directory mapping
      return `/uploads/${file.filename}`;
    }) : [];

    const newProperty = new Property({
      ownerId: req.user.id,
      tenantId: req.user.tenantId || null,
      title,
      description: finalDescription,
      price: Number(price),
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
      advancedFeatures: parsedAdvancedFeatures
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

    const { title, description, price, bhkType, phone, whatsapp, isActive, lat, lng, floor, totalFloors, advancedFeatures } = req.body;
    
    if (title) property.title = title;
    if (description) property.description = description;
    if (price) property.price = Number(price);
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
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
