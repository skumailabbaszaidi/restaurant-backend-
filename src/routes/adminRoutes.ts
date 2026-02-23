import { Router } from 'express';
import { 
    getOrganization,
    getTeam,
    inviteMember,
    updateOrganization,
    getCategories,
    createCategory,
    deleteCategory,
    getAdminItems,
    getAdminOrders,
    createAdminItem,
    updateAdminItem,
    deleteAdminItem
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate); // Protect all admin routes

router.get('/organization', getOrganization);
router.get('/team', getTeam);
router.post('/team/invite', inviteMember);
router.patch('/organization', updateOrganization);

// Category Management
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

// Item Management
router.get('/items', getAdminItems);
router.post('/items', createAdminItem);
router.patch('/items/:id', updateAdminItem);
router.delete('/items/:id', deleteAdminItem);

// Order Management
router.get('/orders', getAdminOrders);

export default router;
