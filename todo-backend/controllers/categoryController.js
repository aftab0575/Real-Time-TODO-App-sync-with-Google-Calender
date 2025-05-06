import Category from '../models/Category.js';
import Todo from '../models/Todo.js';

// Create a new category
export const createCategory = async (req, res) => {
  try {
    const { name, color, isDefault } = req.body;
    const userId = req.user._id; // Assuming user is authenticated and user info is in req.user

    // Check if category with same name already exists for this user
    const existingCategory = await Category.findOne({ name, user: userId });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    const category = new Category({
      name,
      color: color || '#000000',
      isDefault: isDefault || false,
      user: userId
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all categories for a user
export const getCategories = async (req, res) => {
  try {
    const userId = req.user._id;
    const categories = await Category.find({ user: userId });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single category
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a category
export const updateCategory = async (req, res) => {
  try {
    const { name, color, isDefault } = req.body;
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if new name conflicts with existing category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        name,
        user: req.user._id,
        _id: { $ne: category._id }
      });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }

    category.name = name || category.name;
    category.color = color || category.color;
    category.isDefault = isDefault !== undefined ? isDefault : category.isDefault;

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category is being used by any todos
    const todosUsingCategory = await Todo.countDocuments({ category: category._id });
    if (todosUsingCategory > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category that is being used by todos',
        todosCount: todosUsingCategory
      });
    }

    await category.remove();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get default categories for a user
export const getDefaultCategories = async (req, res) => {
  try {
    const defaultCategories = await Category.find({
      user: req.user._id,
      isDefault: true
    });
    res.json(defaultCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 