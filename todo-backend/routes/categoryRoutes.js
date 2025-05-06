import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';

import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getDefaultCategories
} from '../controllers/categoryController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Category routes
router.post('/', createCategory);
router.get('/', getCategories);
router.get('/default', getDefaultCategories);
router.get('/:id', getCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router; 