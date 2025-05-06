import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CategoryProvider } from "./context/CategoryContext";
import Home from "./pages/homePage/Home";
import Auth from "./pages/AuthPage/Auth";
import Categories from "./pages/Categories/Categories";
import CalendarAuthSuccess from "./pages/CalendarAuthSuccess";
import CalendarAuthError from "./pages/CalendarAuthError";
import Navbar from "./components/Navbar";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { syncUserId } from "./services/socketService";
import { setCurrentUserId } from "./redux/notificationSlice";

const App = () => {
  // Synchronize user ID on app startup
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  useEffect(() => {
    if (user && (user._id || user.id)) {
      const userId = user._id || user.id;
      console.log('App: Synchronizing user ID from auth state:', userId);
      
      // Set user ID in both socket service and notification slice
      syncUserId(userId);
      dispatch(setCurrentUserId(userId));
    }
  }, [user, dispatch]);
  
  return (
    <CategoryProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/calendar-auth-success" element={<CalendarAuthSuccess />} />
          <Route path="/calendar-auth-error" element={<CalendarAuthError />} />
        </Routes>
      </Router>
    </CategoryProvider>
  );
};

export default App;
