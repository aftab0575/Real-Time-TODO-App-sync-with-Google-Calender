import Todo from '../models/Todo.js';
import User from '../models/User.js';
import { todoEvents } from '../utils/socketEvents.js';

// Get all todos, optionally filter by category
export async function getTodos(req, res) {
  try {
    const { category, includeCompleted } = req.query;
    const filter = { user: req.user._id };

    if (category) {
      filter.category = category;
    }
    
    // Option to exclude completed tasks
    if (includeCompleted === 'false') {
      filter.completed = false;
    }

    const todos = await Todo.find(filter).sort({ createdAt: -1 });
    res.status(200).json(todos);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// Add a new todo with a category
export async function addTodo(req, res) {
  const { title, category, description, dueDate, dueTime, priority, notificationSettings } = req.body;

  if (!title) return res.status(400).json({ message: 'Title is required' });

  try {
    // Create the todo with optional fields
    const newTodo = await Todo.create({
      title,
      user: req.user._id,
      category: category || 'Personal', // Default category is 'Personal'
      description,
      dueDate,
      dueTime,
      priority: priority || 'Medium',
      notificationSettings: notificationSettings || {
        enableNotifications: true,
        reminderTime: 30
      }
    });

    // Increment the user's todo count
    await User.findByIdAndUpdate(req.user._id, { $inc: { todoCount: 1 } });

    // Emit socket event for real-time update
    todoEvents.todoAdded(req.user._id, newTodo);

    res.status(201).json(newTodo);
  } catch (err) {
    console.error('Error in addTodo:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Update a todo, including the category
export async function updateTodo(req, res) {
  const { id } = req.params;
  const { 
    title, 
    category, 
    description, 
    dueDate, 
    dueTime, 
    priority,
    notificationSettings,
    completed,
    status 
  } = req.body;

  try {
    // Check if due date is being updated and reset reminder flag if needed
    const currentTodo = await Todo.findOne({ _id: id, user: req.user._id });
    
    if (!currentTodo) return res.status(404).json({ message: 'Todo not found' });
    
    // Create update object with submitted fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (completed !== undefined) updateData.completed = completed;
    if (notificationSettings !== undefined) updateData.notificationSettings = notificationSettings;
    
    // If due date is updated, reset the reminder sent flag
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate;
      updateData.reminderSent = false; // Reset flag so notification will be sent
    }
    
    if (dueTime !== undefined) {
      updateData.dueTime = dueTime;
      // Also reset reminder if time changes
      updateData.reminderSent = false;
    }
    
    // Set lastUpdated timestamp
    updateData.lastUpdated = Date.now();
    
    const todo = await Todo.findOneAndUpdate(
      { _id: id, user: req.user._id },
      updateData,
      { new: true }
    );

    // Emit socket event for real-time update
    todoEvents.todoUpdated(req.user._id, todo);

    res.status(200).json(todo);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// Toggle the completion status of a todo
export async function toggleTodo(req, res) {
  const { id } = req.params;

  try {
    const todo = await Todo.findOne({ _id: id, user: req.user._id });
    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    todo.completed = !todo.completed;
    
    // If marking as completed, update status as well
    if (todo.completed) {
      todo.status = 'Done';
    } else if (todo.status === 'Done') {
      // If un-completing a 'Done' task, set to 'In Progress'
      todo.status = 'In Progress';
    }
    
    todo.lastUpdated = Date.now();
    await todo.save();

    // Emit socket event for real-time update
    todoEvents.todoToggled(req.user._id, todo);

    res.status(200).json(todo);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// Delete a todo
export async function deleteTodo(req, res) {
  const { id } = req.params;

  try {
    const todo = await Todo.findOneAndDelete({ _id: id, user: req.user._id });
    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    // Emit socket event for real-time update
    todoEvents.todoDeleted(req.user._id, id);

    res.status(200).json({ message: 'Todo deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// Get upcoming due tasks
export async function getUpcomingTasks(req, res) {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    
    // Find tasks due today or tomorrow that aren't completed
    const upcomingTasks = await Todo.find({
      user: req.user._id,
      dueDate: { $gte: now, $lte: tomorrow },
      completed: false
    }).sort({ dueDate: 1 });
    
    res.status(200).json(upcomingTasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// Get overdue tasks
export async function getOverdueTasks(req, res) {
  try {
    const now = new Date();
    
    // Find tasks that are past due and not completed
    const overdueTasks = await Todo.find({
      user: req.user._id,
      dueDate: { $lt: now },
      completed: false
    }).sort({ dueDate: 1 });
    
    res.status(200).json(overdueTasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// Upload attachment to a todo
export async function uploadAttachment(req, res) {
  const { id } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    console.log('Uploading attachment for todo:', id);
    console.log('File details:', {
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      cloudinaryUrl: req.file.cloudinaryUrl,
      cloudinaryPublicId: req.file.cloudinaryPublicId
    });

    const todo = await Todo.findOne({ _id: id, user: req.user._id });
    if (!todo) {
      console.log('Todo not found:', id);
      return res.status(404).json({ message: 'Todo not found' });
    }

    const fileMeta = {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      cloudinaryUrl: req.file.cloudinaryUrl || req.file.url || req.file.secure_url, // fallback for different middleware
      cloudinaryPublicId: req.file.cloudinaryPublicId,
      size: req.file.size,
      uploadedAt: new Date(),
    };

    todo.attachments.push(fileMeta);
    await todo.save();
    
    // Emit socket event for real-time update after attachment upload
    todoEvents.todoUpdated(req.user._id, todo);
    
    console.log('Attachment uploaded successfully:', fileMeta);
    res.status(200).json(todo);
  } catch (err) {
    console.error('Error in uploadAttachment:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message 
    });
  }
}

export async function deleteAttachment(req, res) {
  const { id, attachmentId } = req.params;

  try {
    const todo = await Todo.findOne({ _id: id, user: req.user._id });
    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    // Remove attachment from todo
    todo.attachments = todo.attachments.filter(att => att._id.toString() !== attachmentId);
    await todo.save();

    // Emit socket event for real-time update after attachment deletion
    todoEvents.todoUpdated(req.user._id, todo);

    res.status(200).json(todo);
  } catch (err) {
    console.error('Error in deleteAttachment:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message 
    });
  }
}
