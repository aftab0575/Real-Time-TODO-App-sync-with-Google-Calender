import axios from 'axios';

const backendBaseUrl = process.env.REACT_APP_BACKEND_BASE_URL;

const API = axios.create({
  baseURL: backendBaseUrl,
});

export default API;
