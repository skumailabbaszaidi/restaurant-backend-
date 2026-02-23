import { Router } from 'express';
import { createOrder, getOrders } from '../controllers/orderController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public: Place Order
router.post('/', createOrder);

// Protected: Get Orders (Admin)
// Note: In real implementation, this should check if user owns the restaurant
router.get('/:slug', authenticate, getOrders);

export default router;
