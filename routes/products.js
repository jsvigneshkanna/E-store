const express = require('express');
const Product = require('../models/product');
const Review = require('../models/review');
const methodOverride = require('method-override');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn');
const isAdmin = require('../middlewares/isAdmin');

router.use(methodOverride('_method'));

router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.render('products/index', { products });
    } catch (error) {
        console.log(error);
        req.flash('error', 'Cannot Find Products');
        res.status(500).render('error');
    }
});
router.get('/product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id).populate('reviews');
        res.render('products/single', { product });
    } catch (error) {
        console.log(error);
        res.status(500).render('error');
    }
});

// Create new product

router.get('/products/new', isLoggedIn, isAdmin, (req, res) => {
    try {
        res.render('products/new');
    } catch (error) {
        console.log(error);
        res.status(500).render('error');
    }
});

router.post('/products/new', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const newProd = req.body.product;
        await Product.create(newProd);
        req.flash('success', 'Successfully created new product');
        res.redirect('/products');
    } catch (error) {
        console.log(error);
        req.flash('error', 'Cannot Create Products,Something is Wrong');

        res.status(500).render('error');
    }
});

// Edit existing product
router.get('/product/:id/edit', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        res.render('products/edit', { product });
    } catch (error) {
        console.log(error);
        req.flash('error', 'Cannot update this Product');
        res.status(500).render('error');
    }
});
router.patch('/product/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndUpdate(id, req.body.product);

        req.flash('success', 'Successfully updated product');

        res.redirect(`/product/${id}`);
    } catch (error) {
        console.log(error);
        req.flash('error', 'Cannot update this Product');
        res.status(500).render('error');
    }
});

// Delete Product
router.delete('/product/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        // Delete associated Reviews first then delete product

        await Review.deleteMany({
            _id: {
                $in: product.reviews
            }
        });
        await product.deleteOne({ _id: id });

        req.flash('success', 'Successfully deleted product');
        res.redirect('/products');
    } catch (error) {
        console.log(error);
        req.flash('error', 'Cannot delete this Product');
        res.status(500).render('error');
    }
});

// Create new Review
router.post('/product/:id/review', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const review = new Review({
            user: req.user.title,
            ...req.body
        });
        const product = await Product.findById(id);

        product.reviews.push(review);
        await review.save();
        await product.save();

        req.flash('success', 'Successfully added new review');

        res.redirect(`/product/${id}`);
    } catch (error) {
        console.log(error);
        req.flash('error', 'Cannot add review to this Product');
        res.status(500).render('error');
    }
});

module.exports = router;
