import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const getRestaurant = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    console.log(`[GET] /restaurants/${slug} requested`);

    const snapshot = await db.collection('organizations').where('slug', '==', slug).limit(1).get();

    if (snapshot.empty) {
      console.warn(`[GET] /restaurants/${slug}: Not found`);
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const doc = snapshot.docs[0];
    console.log(`[GET] /restaurants/${slug}: Found restaurant ID: ${doc.id}`);
    res.json({ id: doc.id, ...doc.data() });
    return;
  } catch (error: any) {
    console.error(`[GET] /restaurants/${req.params.slug} ERROR:`, error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
    return;
  }
};

// Get Categories for a Restaurant (Public)
export const getCategories = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    console.log(`[GET] /restaurants/${slug}/categories requested`);

    const orgSnapshot = await db.collection('organizations').where('slug', '==', slug).limit(1).get();
    if (orgSnapshot.empty) {
        return res.status(404).json({ error: 'Restaurant not found' });
    }
    const orgId = orgSnapshot.docs[0].id;

    const categoriesSnapshot = await db.collection('organizations')
      .doc(orgId)
      .collection('categories')
      .orderBy('order')
      .get();
    
    const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(categories);
    return;
  } catch (error: any) {
    console.error(`[GET] /restaurants/${req.params.slug}/categories ERROR:`, error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
    return;
  }
};
