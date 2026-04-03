import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { restaurantSlug, tableNumber, items, total, customerName, customerPhone } = req.body;
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

    // 2. Generate unique 6-digit order number
    const orderNumber = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 3. Add Order to Sub-collection
    const orderData = {
      restaurantSlug,
      tableNumber,
      items,
      total,
      orderNumber,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      status: 'pending',
      createdAt: new Date(),
    };

    const docRef = await db.collection('organizations')
        .doc(orgId)
        .collection('orders')
        .add(orderData);

    console.log(`[POST] /orders: Order created with ID: ${docRef.id} and number: ${orderNumber}`);
    
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

export const getOrderByNumber = async (req: Request, res: Response) => {
    try {
        const orderNumber = req.params.orderNumber as string;
        const restaurantSlug = req.query.restaurantSlug as string;

        console.log(`[GET] /orders/track/${orderNumber} for restaurant: ${restaurantSlug}`);

        if (!orderNumber || !restaurantSlug) {
            return res.status(400).json({ error: 'Order number and restaurant slug are required' });
        }

        const orgSnapshot = await db.collection('organizations').where('slug', '==', restaurantSlug).limit(1).get();
        if (orgSnapshot.empty) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        const orgId = orgSnapshot.docs[0].id;

        const orderSnapshot = await db.collection('organizations')
            .doc(orgId)
            .collection('orders')
            .where('orderNumber', '==', (orderNumber as string).toUpperCase())
            .limit(1)
            .get();

        if (orderSnapshot.empty) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const orderData = orderSnapshot.docs[0].data();
        res.json({ id: orderSnapshot.docs[0].id, ...orderData });
        return;
    } catch (error: any) {
        console.error(`[GET] /orders/track ERROR:`, error.message);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
    }
};

export const submitFeedback = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { rating, feedback } = req.body;
        const restaurantSlug = req.body.restaurantSlug as string;

        if (!id || !rating || !restaurantSlug) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const orgSnapshot = await db.collection('organizations').where('slug', '==', restaurantSlug).limit(1).get();
        if (orgSnapshot.empty) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        const orgId = orgSnapshot.docs[0].id;

        await db.collection('organizations')
            .doc(orgId)
            .collection('orders')
            .doc(id)
            .update({
                rating,
                feedback,
                feedbackSubmittedAt: new Date()
            });

        res.json({ success: true });
        return;
    } catch (error: any) {
        console.error(`[POST] /orders/feedback ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to submit feedback' });
        return;
    }
};

export const getAllFeedback = async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        // Fetch all orders and filter in-memory to avoid composite index requirements
        const snapshot = await db.collection('organizations')
            .doc(organizationId)
            .collection('orders')
            .orderBy('createdAt', 'desc')
            .get();

        const feedback = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((order: any) => order.rating != null)
            .map((order: any) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                rating: order.rating,
                feedback: order.feedback,
                createdAt: order.createdAt,
                items: order.items
            }));

        res.json(feedback);
        return;
    } catch (error: any) {
        console.error(`[GET] /admin/feedback ERROR:`, error.message);
        res.status(500).json({ error: 'Failed to fetch feedback' });
        return;
    }
};

export const requestWaiter = async (req: Request, res: Response) => {
    try {
        const { restaurantSlug, tableNumber } = req.body;
        console.log(`[POST] /orders/waiter-request for restaurant: ${restaurantSlug}, table: ${tableNumber}`);

        if (!restaurantSlug || !tableNumber) {
            return res.status(400).json({ error: 'Restaurant slug and table number are required' });
        }

        // 1. Resolve Org ID from Slug
        const orgSnapshot = await db.collection('organizations').where('slug', '==', restaurantSlug).limit(1).get();
        if (orgSnapshot.empty) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        const orgId = orgSnapshot.docs[0].id;

        // 2. Add Waiter Request to Sub-collection
        const requestData = {
            tableNumber,
            status: 'pending',
            createdAt: new Date(),
        };

        const docRef = await db.collection('organizations')
            .doc(orgId)
            .collection('waiterRequests')
            .add(requestData);

        console.log(`[POST] /orders/waiter-request: Request created with ID: ${docRef.id}`);
        res.status(201).json({ id: docRef.id, ...requestData });
        return;
    } catch (error: any) {
        console.error(`[POST] /orders/waiter-request ERROR:`, error.message);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
    }
};
