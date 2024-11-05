// Import express
const express = require("express");

// Init express router
const router = express.Router();

// Import validators and middleware
const {
  validateLogin,
  validateUser,
  validateCategory,
  validateProduct,
} = require("../utils/validators");

const {
  handleValidationErrors,
  verifyToken,
  upload,
} = require("../middlewares");

// Import controllers
const loginController = require("../controllers/LoginController");
const userController = require("../controllers/UserController");
const categoryController = require("../controllers/CategoryController");
const productController = require("../controllers/ProductController");

// Define routes
const routes = [
  // Login route
  {
    method: "post",
    path: "/login",
    middlewares: [validateLogin, handleValidationErrors],
    handler: loginController.login,
  },
  // User routes
  {
    method: "get",
    path: "/users",
    middlewares: [verifyToken],
    handler: userController.findUsers,
  },
  {
    method: "post",
    path: "/users",
    middlewares: [verifyToken, validateUser, handleValidationErrors],
    handler: userController.createUser,
  },
  {
    method: "get",
    path: "/users/:id",
    middlewares: [verifyToken],
    handler: userController.findUserById,
  },
  {
    method: "put",
    path: "/users/:id",
    middlewares: [verifyToken, validateUser, handleValidationErrors],
    handler: userController.updateUser,
  },
  {
    method: "delete",
    path: "/users/:id",
    middlewares: [verifyToken],
    handler: userController.deleteUser,
  },

  // Category routes
  {
    method: "get",
    path: "/categories",
    middlewares: [verifyToken],
    handler: categoryController.findCategories,
  },
  {
    method: "post",
    path: "/categories",
    middlewares: [
      verifyToken,
      upload.single("image"),
      validateCategory,
      handleValidationErrors,
    ],
    handler: categoryController.createCategory,
  },
  {
    method: "get",
    path: "/categories/:id",
    middlewares: [verifyToken],
    handler: categoryController.findCategoryById,
  },
  {
    method: "put",
    path: "/categories/:id",
    middlewares: [
      verifyToken,
      upload.single("image"),
      validateCategory,
      handleValidationErrors,
    ],
    handler: categoryController.updateCategory,
  },
  {
    method: "delete",
    path: "/categories/:id",
    middlewares: [verifyToken],
    handler: categoryController.deleteCategory,
  },
  {
    method: "get",
    path: "/categories-all",
    middlewares: [verifyToken],
    handler: categoryController.allCategories,
  },

  // Product routes
  {
    method: "get",
    path: "/products",
    middlewares: [verifyToken],
    handler: productController.findProducts,
  },
  {
    method: "post",
    path: "/products",
    middlewares: [
      verifyToken,
      upload.single("image"),
      validateProduct,
      handleValidationErrors,
    ],
    handler: productController.createProduct,
  },
  {
    method: "get",
    path: "/products/:id",
    middlewares: [verifyToken],
    handler: productController.findProductById,
  },
  {
    method: "put",
    path: "/products/:id",
    middlewares: [
      verifyToken,
      upload.single("image"),
      validateProduct,
      handleValidationErrors,
    ],
    handler: productController.updateProduct,
  },
  {
    method: "delete",
    path: "/products/:id",
    middlewares: [verifyToken],
    handler: productController.deleteProduct,
  },
];

// Helper function to create routes
const createRoutes = (routes) => {
  routes.forEach(({ method, path, middlewares, handler }) => {
    router[method](path, ...middlewares, handler);
  });
};

// Create routes
createRoutes(routes);

// Export router
module.exports = router;
