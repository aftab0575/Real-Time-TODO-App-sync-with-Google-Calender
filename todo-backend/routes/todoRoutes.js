import { Router } from 'express';
const router = Router();
import authMiddleware from '../middleware/authMiddleware.js';
import { 
  getTodos, 
  addTodo, 
  updateTodo, 
  toggleTodo, 
  deleteTodo, 
  uploadAttachment, 
  deleteAttachment,
  getUpcomingTasks,
  getOverdueTasks
} from '../controllers/todoController.js';
import upload, { uploadToCloudinary } from '../middleware/upload.js';

// All routes are protected
router.use(authMiddleware);

// Todo CRUD operations
router.get('/', getTodos);
router.post('/', addTodo);
router.put('/:id', updateTodo);
router.patch('/toggle/:id', toggleTodo);
router.delete('/:id', deleteTodo);

// Due date-related routes
router.get('/upcoming', getUpcomingTasks);
router.get('/overdue', getOverdueTasks);

// Upload and delete attachments
router.post('/:id/attachments', upload.single('file'), uploadToCloudinary, uploadAttachment);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

export default router;
