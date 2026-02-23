import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { AuthRequest } from '../middleware/auth';

export const getMenu = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    console.log(`[GET] /menu: Fetching for slug: ${slug}`);

    // 1. Get Org ID from Slug
    const orgSnapshot = await db.collection('organizations').where('slug', '==', slug).limit(1).get();
    if (orgSnapshot.empty) {
        console.warn(`[GET] /menu: Restaurant not found for slug: ${slug}`);
        return res.status(404).json({ error: 'Restaurant not found' });
    }
    const orgId = orgSnapshot.docs[0].id;

    // 2. Get Categories from Sub-collection
    console.log(`[GET] /menu: Fetching categories from sub-collection for orgId: ${orgId}`);
    const categoriesSnapshot = await db.collection('organizations')
      .doc(orgId)
      .collection('categories')
      .orderBy('order')
      .get();
    
    const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 3. Get Items from Sub-collection
    console.log(`[GET] /menu: Fetching items from sub-collection for orgId: ${orgId}`);
    const itemsSnapshot = await db.collection('organizations')
      .doc(orgId)
      .collection('items')
      .where('available', '==', true)
      .get();
    
    const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`[GET] /menu: Success! Returning ${categories.length} categories and ${items.length} items.`);
    res.json({ categories, items });
    return;
  } catch (error: any) {
    console.error(`[GET] /menu ERROR for slug ${req.params.slug}:`, error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
    return;
  }
};

export const addMenuItem = async (req: AuthRequest, res: Response) => {
    try {
        const itemData = req.body;
        const organizationId = req.user?.organizationId;
        console.log(`[POST] /menu: Adding item to sub-collection for organization: ${organizationId}`);

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
                available: true,
                createdAt: new Date()
            });

        console.log(`[POST] /menu: Item added with ID: ${docRef.id} in org sub-collection`);
        res.status(201).json({ id: docRef.id, ...itemData });
        return;
    } catch (error: any) {
        console.error(`[POST] /menu ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to add item', details: error.message });
        return;
    }
};

export const updateMenuItem = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const updates = req.body;
        const organizationId = req.user?.organizationId;
        console.log(`[PATCH] /menu/${id}: Updating item in orgId ${organizationId}`);
        
        if (!id || !organizationId) {
             res.status(400).json({ error: 'Missing ID or organization context' });
             return;
        }

        await db.collection('organizations')
            .doc(organizationId)
            .collection('items')
            .doc(id)
            .update(updates);

        console.log(`[PATCH] /menu/${id}: Success in org sub-collection`);
        res.json({ success: true });
        return;
    } catch (error: any) {
        console.error(`[PATCH] /menu/${req.params.id} ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to update item', details: error.message });
        return;
    }
};
