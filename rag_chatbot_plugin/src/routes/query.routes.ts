import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { QueryController } from '../controllers/query.controller';

const router = Router();
const controller = new QueryController();

router.post('/query', authMiddleware, controller.query);
router.get('/conversations/:userId', authMiddleware, controller.getConversations);

export default router;
