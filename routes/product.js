const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// CREATE Product
router.post('/add', upload.single('image'), async (req, res) => {
  try {
    const { name, description, mrp, discount, inStock, category } = req.body;
    const price = mrp - (mrp * discount) / 100;

    const newProduct = new Product({
      name,
      description,
      mrp,
      discount,
      price,
      inStock: inStock === 'true',
      category,
      image: `/uploads/${req.file.filename}`,
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (err) {
    console.error('Product creation error:', err);
    res.status(500).json({ message: 'Failed to add product' });
  }
});


// GET All Products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

module.exports = router;
