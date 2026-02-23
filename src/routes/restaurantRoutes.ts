import { Router } from 'express';
import { getRestaurant, getCategories as getPublicCategories } from '../controllers/restaurantController';
import { getMenu } from '../controllers/menuController';

const router = Router();

// Public Routes
router.get('/:slug', getRestaurant);
router.get('/:slug/menu', getMenu);
router.get('/:slug/categories', getPublicCategories);

export default router;
