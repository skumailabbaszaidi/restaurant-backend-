import { Router } from 'express';
import { 
  createOrder, 
  getOrderByNumber, 
  submitFeedback, 
  getAllFeedback,
  requestWaiter,
} from '../controllers/orderController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public: Place Order
router.post('/', createOrder);

// Public: Track Order by Number
router.get('/track/:orderNumber', getOrderByNumber);
router.get('/track', (req, res) => {
    res.status(400).json({ error: 'Order number is required' });
});

// Public: Submit Feedback
router.post('/:id/feedback', submitFeedback);

// Public: Request Waiter
router.post('/waiter-request', requestWaiter);

// Protected: Admin Endpoints
router.get('/admin/feedback', authenticate, getAllFeedback);

export default router;
