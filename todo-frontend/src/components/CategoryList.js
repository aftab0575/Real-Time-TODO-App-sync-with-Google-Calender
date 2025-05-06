import React, { useState } from 'react';
import { useCategories } from '../context/CategoryContext';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const CategoryList = () => {
  const { 
    categories, 
    loading, 
    error, 
    deleteCategory,
    createCategory,
    updateCategory 
  } = useCategories();
  
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '#000000',
    isDefault: false
  });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(id);
      } catch (error) {
        alert(error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory._id, formData);
      } else {
        await createCategory(formData);
      }
      setFormData({ name: '', color: '#000000', isDefault: false });
      setEditingCategory(null);
      setShowAddForm(false);
    } catch (error) {
      alert(error);
    }
  };

  if (loading) return <div>Loading categories...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="category-list">
      <div className="category-header">
        <h2>Categories</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <FaPlus /> Add Category
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="category-form">
          <input
            type="text"
            placeholder="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
          <label>
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            />
            Default Category
          </label>
          <button type="submit" className="btn btn-primary">
            {editingCategory ? 'Update' : 'Create'} Category
          </button>
        </form>
      )}

      <div className="categories-grid">
        {categories.map(category => (
          <div 
            key={category._id} 
            className="category-card"
            style={{ borderLeft: `4px solid ${category.color}` }}
          >
            <div className="category-info">
              <h3>{category.name}</h3>
              <span className="category-color" style={{ backgroundColor: category.color }} />
            </div>
            <div className="category-actions">
              <button
                className="btn btn-icon"
                onClick={() => {
                  setEditingCategory(category);
                  setFormData({
                    name: category.name,
                    color: category.color,
                    isDefault: category.isDefault
                  });
                  setShowAddForm(true);
                }}
              >
                <FaEdit />
              </button>
              <button
                className="btn btn-icon"
                onClick={() => handleDelete(category._id)}
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryList; 