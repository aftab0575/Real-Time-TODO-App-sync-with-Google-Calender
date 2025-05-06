import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const CategoryContext = createContext();

export const useCategories = () => {
  return useContext(CategoryContext);
};

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Get token from Redux auth state
  const token = useSelector(state => state.auth.token);
  
  // Get the backend URL from environment, with fallback
  const backendBaseUrl = process.env.REACT_APP_BACKEND_BASE_URL || 'https://real-time-todo-app-sync-with-google.onrender.com';

  // Fetch all categories
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[CategoryContext] Fetching categories with token:', token);
      const response = await axios.get(`${backendBaseUrl}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure response.data is an array
      const categoriesData = Array.isArray(response.data) ? response.data : [];
      setCategories(categoriesData);
      setError(null);
      console.log('[CategoryContext] Categories fetched:', categoriesData);
    } catch (err) {
      console.error('[CategoryContext] Error fetching categories:', err);
      setError(err.response?.data?.message || 'Error fetching categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Create a new category
  const createCategory = async (categoryData) => {
    try {
      const response = await axios.post(`${backendBaseUrl}/api/categories`, categoryData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error('[CategoryContext] Error creating category:', err);
      throw err.response?.data?.message || 'Error creating category';
    }
  };

  // Update a category
  const updateCategory = async (id, categoryData) => {
    try {
      const response = await axios.put(`${backendBaseUrl}/api/categories/${id}`, categoryData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(prev => 
        prev.map(category => 
          category._id === id ? response.data : category
        )
      );
      return response.data;
    } catch (err) {
      console.error('[CategoryContext] Error updating category:', err);
      throw err.response?.data?.message || 'Error updating category';
    }
  };

  // Delete a category
  const deleteCategory = async (id) => {
    try {
      await axios.delete(`${backendBaseUrl}/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(prev => prev.filter(category => category._id !== id));
    } catch (err) {
      console.error('[CategoryContext] Error deleting category:', err);
      throw err.response?.data?.message || 'Error deleting category';
    }
  };

  // Get category by ID
  const getCategoryById = (id) => {
    return categories.find(category => category._id === id);
  };

  // Refetch categories if token changes (e.g., login/logout)
  useEffect(() => {
    if (token) {
      fetchCategories();
    } else {
      setCategories([]);
    }
    // eslint-disable-next-line
  }, [token]);

  // Initial fetch
  useEffect(() => {
    if (token) fetchCategories();
    // eslint-disable-next-line
  }, []);

  const value = {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    fetchCategories
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}; 
