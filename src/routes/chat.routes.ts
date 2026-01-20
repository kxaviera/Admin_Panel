import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { getChats, getChatById, getChatByRide, sendChatMessage } from '../controllers/chat.controller';

const router = Router();

// All chat routes require authentication.
router.use(protect);

// Admin: list all chats (operations/support)
router.get('/', restrictTo('admin'), getChats);

// User/Driver/Admin: get chat for a ride (creates if missing, once driver assigned)
router.get('/ride/:rideId', getChatByRide);

// User/Driver/Admin: get chat by id (access controlled in controller)
router.get('/:id', getChatById);

// User/Driver/Admin: send message (access controlled in controller)
router.post('/:id/messages', sendChatMessage);

export default router;

