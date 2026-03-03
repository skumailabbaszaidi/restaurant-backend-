import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { restaurantSlug, tableNumber, items, total } = req.body;
    console.log(`[POST] /orders requested for restaurant: ${restaurantSlug}`);

    if (!restaurantSlug || !items || items.length === 0) {
      console.warn(`[POST] /orders: Missing required fields`);
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // 1. Resolve Org ID from Slug
    const orgSnapshot = await db.collection('organizations').where('slug', '==', restaurantSlug).limit(1).get();
    if (orgSnapshot.empty) {
        console.warn(`[POST] /orders: Restaurant not found: ${restaurantSlug}`);
        return res.status(404).json({ error: 'Restaurant not found' });
    }
    const orgId = orgSnapshot.docs[0].id;

    // 2. Add Order to Sub-collection
    const orderData = {
      restaurantSlug,
      tableNumber,
      items,
      total,
      status: 'pending',
      createdAt: new Date(),
    };

    const docRef = await db.collection('organizations')
        .doc(orgId)
        .collection('orders')
        .add(orderData);

    console.log(`[POST] /orders: Order created with ID: ${docRef.id} in org sub-collection`);
    
    res.status(201).json({ id: docRef.id, ...orderData });
    return;
  } catch (error: any) {
    console.error(`[POST] /orders ERROR:`, error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
    return;
  }
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const organizationId = (req as any).user?.organizationId; // From auth middleware
        console.log(`[GET] /orders/${slug} requested for orgId: ${organizationId}`);

        // 1. Resolve Org ID from Slug (or use organizationId directly if we trust the user)
        // For security, we should ensure the user is requesting their OWN organization's orders
        const orgSnapshot = await db.collection('organizations').where('slug', '==', slug).limit(1).get();
        if (orgSnapshot.empty) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        const targetOrgId = orgSnapshot.docs[0].id;

        if (targetOrgId !== organizationId) {
            console.warn(`[GET] /orders/${slug}: Unauthorized access attempt by org: ${organizationId}`);
            return res.status(403).json({ error: 'Unauthorized access to these orders' });
        }

        // 2. Fetch from Sub-collection
        const snapshot = await db.collection('organizations')
            .doc(targetOrgId)
            .collection('orders')
            .orderBy('createdAt', 'desc')
            .get();
        
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`[GET] /orders/${slug}: Found ${orders.length} orders in sub-collection`);
        res.json(orders);
        return;
    } catch (error: any) {
        console.error(`[GET] /orders/${req.params.slug} ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
        return;
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const organizationId = (req as any).user?.organizationId;

        console.log(`[PATCH] /orders/${id}: Updating status to ${status} for orgId: ${organizationId}`);

        if (!id || !status || !organizationId) {
            return res.status(400).json({ error: 'Missing ID, status, or organization context' });
        }

        const orderRef = db.collection('organizations')
            .doc(organizationId)
            .collection('orders')
            .doc(id as string);

        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await orderRef.update({ 
            status,
            updatedAt: new Date()
        });

        console.log(`[PATCH] /orders/${id}: Success`);
        res.json({ success: true, id, status });
        return;
    } catch (error: any) {
        console.error(`[PATCH] /orders/${req.params.id} ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to update order status', details: error.message });
        return;
    }
};
