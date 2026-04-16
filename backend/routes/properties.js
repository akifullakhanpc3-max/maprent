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
    const { bounds, minRent, maxRent, bhkType, city, radius, lat, lng, amenities } = req.query;

    let query = { status: 'approved' };

    // Basic filters
    if (minRent || maxRent) {
      query.rent = {};
      if (minRent) query.rent.$gte = Number(minRent);
      if (maxRent) query.rent.$lte = Number(maxRent);
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
    const { title, description, rent, bhkType, city, amenities, video, phone, whatsapp, lat, lng, allowedFor, useAI } = req.query.city ? req.query : req.body;
    
    let finalDescription = description;
    if (useAI) {
      try {
        finalDescription = await aiService.generatePropertyDescription({ title, rent, bhkType, amenities: JSON.parse(amenities), allowedFor: JSON.parse(allowedFor) });
      } catch (aiErr) {
        console.error('AI Description failed, falling back to user description:', aiErr.message);
      }
    }
    
    const parsedAmenities = amenities ? (Array.isArray(amenities) ? amenities : JSON.parse(amenities)) : [];
    const parsedAllowedFor = allowedFor ? (Array.isArray(allowedFor) ? allowedFor : JSON.parse(allowedFor)) : ['Bachelors', 'Family', 'Couples'];

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
      rent: Number(rent),
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
      }
    });

    const property = await newProperty.save();
    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
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

    const { title, description, rent, bhkType, phone, whatsapp, isActive, lat, lng } = req.body;
    
    if (title) property.title = title;
    if (description) property.description = description;
    if (rent) property.rent = Number(rent);
    if (bhkType) property.bhkType = bhkType;
    if (phone) property.phone = phone;
    if (whatsapp) property.whatsapp = whatsapp;
    if (isActive !== undefined) property.isActive = isActive;

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
