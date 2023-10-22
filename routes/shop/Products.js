// All routes related to Product's

const express = require("express");
const Products = require("../../schema/shop/ProductSchema");
const User = require("../../schema/user/UserSchema");
const router = express.Router();
const { STATUSCODE, STATUSMESSAGE } = require("../../utils/Status");

// Route 1  -  Adding Products

/**
 * @description Add Product
 * @route POST /addproduct
 * @access Public
 * @requires productSlug (string), other fields (as per the productSchema)
 * @returns Saved product object (JSON)
 */

router.post("/addproduct", async (req, res) => {
  try {
    const { productSlug, ...data } = req.body;

    const existingSlug = await Products.findOne({ productSlug }); //productSlug should be unique

    if (existingSlug) {
      return res
        .status(STATUSCODE.CONFLICT)
        .json({ message: STATUSMESSAGE.PRODUCT_SLUG_ALREADY_EXISTS });
    }

    // Create a new product object based on the schema
    const newProduct = new Products({ ...data, productSlug });

    // Save the new product to the database
    const savedProduct = await newProduct.save();

    res.status(STATUSCODE.CREATED).json(savedProduct); // Return the saved product as a response
  } catch (error) {
    console.error("Error adding product:", error);
    res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: STATUSMESSAGE.PRODUCT_ADD_FAILED });
  }
});

// Route 2  -  Fetching all Products
/**
 * @description Get all products
 * @route GET /products
 * @access Public
 * @returns Array of all products
 */
router.get("/allproducts", async (req, res) => {
  try {
    const allProducts = await Products.find();
    res.status(STATUSCODE.OK).json(allProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: STATUSMESSAGE.PRODUCT_FETCH_FAILED });
  }
});

// Route 3 - Fetching a single product by slug
/**
 * @description Get a product by slug
 * @route GET /products/:productSlug
 * @access Public
 * @returns Product object (JSON)
 */
router.get("/:productSlug", async (req, res) => {
  try {
    const { productSlug } = req.params;

    const product = await Products.findOne({ productSlug });

    if (!product) {
      return res
        .status(STATUSCODE.NOT_FOUND)
        .json({ message: STATUSMESSAGE.PRODUCT_NOT_FOUND });
    }

    res.status(STATUSCODE.OK).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: STATUSMESSAGE.PRODUCT_FETCH_FAILED });
  }
});

// Route 4 - Add to Cart
/**
 * @description Add a product to the cart
 * @route POST /cart/add
 * @access Public
 * @requires email (string)
 * @requires productId (string)
 * @returns Updated cart object (JSON)
 */
router.post("/cart/add", async (req, res) => {
  try {
    const { email, productId } = req.body;
    const response = await User.updateOne(
      { email: email },
      { $push: { cart: { id: productId } } },
    );
    if (response.modifiedCount === 1) {
      return res.send("Product added successfully");
    } else {
      res
        .status(STATUSCODE.NOT_FOUND)
        .json({ message: STATUSMESSAGE.USER_NOT_FOUND });
    }
  } catch (err) {
    res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: STATUSMESSAGE.PRODUCT_ADD_FAILED });
    console.log(err);
  }
});

module.exports = router;
