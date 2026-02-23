import { Response } from 'express';
import { db, auth } from '../config/firebase';
import { AuthRequest } from '../middleware/auth';

// Get Team Members
export const getTeam = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    console.log(`[GET] /admin/team requested for orgId: ${organizationId}`);

    if (!organizationId) {
        res.status(400).json({ error: 'Missing organization context' });
        return;
    }

    const snapshot = await db.collection('users')
      .where('organizationId', '==', organizationId)
      .get();
    
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`[GET] /admin/team: Found ${users.length} members`);
    res.json(users);
    return;
  } catch (error: any) {
    console.error(`[GET] /admin/team ERROR:`, error.message);
    res.status(500).json({ error: 'Failed to fetch team', details: error.message });
    return;
  }
};

// Invite Member
export const inviteMember = async (req: AuthRequest, res: Response) => {
    try {
        const { email, name, role } = req.body;
        const organizationId = req.user?.organizationId;
        console.log(`[POST] /admin/team/invite: Inviting ${email} to orgId ${organizationId}`);

        if (!email || !name || !role || !organizationId) {
            res.status(400).json({ error: 'Missing fields or organization context' });
            return;
        }

        let uid;
        try {
            const userRecord = await auth.getUserByEmail(email);
            uid = userRecord.uid;
            console.log(`[POST] /admin/team/invite: User already exists with UID: ${uid}`);
        } catch (e) {
            const userRecord = await auth.createUser({
                email,
                displayName: name,
                password: 'tempPassword123!', 
            });
            uid = userRecord.uid;
            console.log(`[POST] /admin/team/invite: New user created with UID: ${uid}`);
        }

        await db.collection('users').doc(uid).set({
            email,
            name,
            role,
            organizationId,
            createdAt: new Date()
        });
        console.log(`[POST] /admin/team/invite: Profile created in Firestore for UID: ${uid}`);

        res.status(201).json({ message: 'User invited successfully', uid });
        return;
    } catch (error: any) {
        console.error(`[POST] /admin/team/invite ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to invite user', details: error.message });
        return;
    }
};

// Update Organization
export const updateOrganization = async (req: AuthRequest, res: Response) => {
    try {
        const updates = req.body;
        const organizationId = req.user?.organizationId;
        console.log(`[PATCH] /admin/organization: Updating orgId: ${organizationId}`);

        if (!organizationId) {
             res.status(400).json({ error: 'Missing organization context' });
             return;
        }

        await db.collection('organizations').doc(organizationId).update(updates);
        console.log(`[PATCH] /admin/organization: Updated successfully`);
        res.json({ success: true });
        return;
    } catch (error: any) {
         console.error(`[PATCH] /admin/organization ERROR:`, error.message);
         res.status(500).json({ error: 'Failed to update organization', details: error.message });
         return;
    }
}

// Get Organization Details
export const getOrganization = async (req: AuthRequest, res: Response) => {
    try {
        const organizationId = req.user?.organizationId;
        console.log(`[GET] /admin/organization requesting for orgId: ${organizationId}`);

        if (!organizationId) {
            res.status(400).json({ error: 'Missing organization context' });
            return;
        }

        const doc = await db.collection('organizations').doc(organizationId).get();
        if (!doc.exists) {
            console.warn(`[GET] /admin/organization: Org not found for ID: ${organizationId}`);
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        console.log(`[GET] /admin/organization: Found org: ${doc.data()?.name}`);
        res.json({ id: doc.id, ...doc.data() });
        return;
    } catch (error: any) {
        console.error(`[GET] /admin/organization ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to fetch organization', details: error.message });
        return;
    }
};

// --- Category Management ---

// Get All Categories
export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        const organizationId = req.user?.organizationId;
        console.log(`[GET] /admin/categories requested for orgId: ${organizationId}`);

        if (!organizationId) {
            res.status(400).json({ error: 'Missing organization context' });
            return;
        }

        const snapshot = await db.collection('organizations')
            .doc(organizationId)
            .collection('categories')
            .orderBy('order')
            .get();

        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(categories);
        return;
    } catch (error: any) {
        console.error(`[GET] /admin/categories ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
        return;
    }
};

// Create Category
export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { name, order } = req.body;
        const organizationId = req.user?.organizationId;
        console.log(`[POST] /admin/categories: Creating "${name}" for orgId: ${organizationId}`);

        if (!organizationId || !name) {
            res.status(400).json({ error: 'Missing name or organization context' });
            return;
        }

        const docRef = await db.collection('organizations')
            .doc(organizationId)
            .collection('categories')
            .add({
                name,
                order: order || 0,
                createdAt: new Date()
            });

        res.status(201).json({ id: docRef.id, name, order });
        return;
    } catch (error: any) {
        console.error(`[POST] /admin/categories ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to create category', details: error.message });
        return;
    }
};

// Delete Category
export const deleteCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const organizationId = req.user?.organizationId;
        console.log(`[DELETE] /admin/categories/${id} for orgId: ${organizationId}`);

        if (!organizationId || !id) {
            res.status(400).json({ error: 'Missing ID or organization context' });
            return;
        }

        await db.collection('organizations')
            .doc(organizationId)
            .collection('categories')
            .doc(id)
            .delete();

        console.log(`[DELETE] /admin/categories/${id}: Success`);
        res.json({ success: true });
        return;
    } catch (error: any) {
        console.error(`[DELETE] /admin/categories/${req.params.id} ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to delete category', details: error.message });
        return;
    }
};

// --- Admin Item Management ---

// Get All Items for Admin
export const getAdminItems = async (req: AuthRequest, res: Response) => {
    try {
        const organizationId = req.user?.organizationId;
        console.log(`[GET] /admin/items requested for orgId: ${organizationId}`);

        if (!organizationId) {
            res.status(400).json({ error: 'Missing organization context' });
            return;
        }

        const snapshot = await db.collection('organizations')
            .doc(organizationId)
            .collection('items')
            .get();

        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(items);
        return;
    } catch (error: any) {
        console.error(`[GET] /admin/items ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to fetch items', details: error.message });
        return;
    }
};

// --- Admin Order Management ---

// Get All Orders for Admin (the org he belongs to)
export const getAdminOrders = async (req: AuthRequest, res: Response) => {
    try {
        const organizationId = req.user?.organizationId;
        console.log(`[GET] /admin/orders requested for orgId: ${organizationId}`);

        if (!organizationId) {
            res.status(400).json({ error: 'Missing organization context' });
            return;
        }

        const snapshot = await db.collection('organizations')
            .doc(organizationId)
            .collection('orders')
            .orderBy('createdAt', 'desc')
            .get();

        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(orders);
        return;
    } catch (error: any) {
        console.error(`[GET] /admin/orders ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
        return;
    }
};

// Create Item
export const createAdminItem = async (req: AuthRequest, res: Response) => {
    try {
        const itemData = req.body;
        const organizationId = req.user?.organizationId;
        console.log(`[POST] /admin/items requested for orgId: ${organizationId}`);

        if (!organizationId) {
            res.status(400).json({ error: 'Missing organization context' });
            return;
        }

        const docRef = await db.collection('organizations')
            .doc(organizationId)
            .collection('items')
            .add({
                ...itemData,
                organizationId, // Keep for backward compat/filtering
                available: itemData.available ?? true,
                createdAt: new Date()
            });

        console.log(`[POST] /admin/items: Item added with ID: ${docRef.id}`);
        res.status(201).json({ id: docRef.id, ...itemData });
        return;
    } catch (error: any) {
        console.error(`[POST] /admin/items ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to add item', details: error.message });
        return;
    }
};

// Update Item
export const updateAdminItem = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const updates = req.body;
        const organizationId = req.user?.organizationId;
        console.log(`[PATCH] /admin/items/${id} requested for orgId: ${organizationId}`);
        
        if (!id || !organizationId) {
             res.status(400).json({ error: 'Missing ID or organization context' });
             return;
        }

        await db.collection('organizations')
            .doc(organizationId)
            .collection('items')
            .doc(id)
            .update(updates);

        console.log(`[PATCH] /admin/items/${id}: Success`);
        res.json({ success: true });
        return;
    } catch (error: any) {
        console.error(`[PATCH] /admin/items/${req.params.id} ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to update item', details: error.message });
        return;
    }
};

// Delete Item
export const deleteAdminItem = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const organizationId = req.user?.organizationId;
        console.log(`[DELETE] /admin/items/${id} requested for orgId: ${organizationId}`);

        if (!id || !organizationId) {
             res.status(400).json({ error: 'Missing ID or organization context' });
             return;
        }

        await db.collection('organizations')
            .doc(organizationId)
            .collection('items')
            .doc(id)
            .delete();

        console.log(`[DELETE] /admin/items/${id}: Success`);
        res.json({ success: true });
        return;
    } catch (error: any) {
        console.error(`[DELETE] /admin/items/${req.params.id} ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to delete item', details: error.message });
        return;
    }
};
