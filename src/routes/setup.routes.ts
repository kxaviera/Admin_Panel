import { Router } from 'express';
import { firebaseSetupPage, saveFirebaseEnv } from '../controllers/setup.controller';

const router = Router();

router.get('/firebase', firebaseSetupPage);
router.post('/firebase', saveFirebaseEnv);

export default router;

