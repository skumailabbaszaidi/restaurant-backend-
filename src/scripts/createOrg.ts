import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(__dirname, '../../.env') });

// Initialize Firebase Admin with Service Account
// We need the service account here because this script runs locally, not in Cloud Functions
const serviceAccountPath = resolve(__dirname, '../../restaurant-proto-c1826-firebase-adminsdk-fbsvc-d77d392fa8.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin Initialized for CLI');
} catch (error) {
  console.error('Failed to load service account key. Ensure it exists at:', serviceAccountPath);
  console.error(error);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
};

const createOrganizationAndUser = async () => {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: npm run create-org <orgName> <email> <password>');
    process.exit(1);
  }

  const [orgName, email, password] = args;
  const slug = slugify(orgName);

  try {
    console.log(`\nCreating Organization: ${orgName}...`);
    console.log(`Auto-generated Slug: ${slug}`);

    // 1. Check if Organization Name already exists
    const nameQuery = await db.collection('organizations').where('name', '==', orgName).get();
    if (!nameQuery.empty) {
      console.error(`Error: Organization name "${orgName}" already exists.`);
      process.exit(1);
    }

    // 2. Check if Organization Slug already exists (safeguard)
    const slugQuery = await db.collection('organizations').where('slug', '==', slug).get();
    if (!slugQuery.empty) {
      console.error(`Error: Organization slug "${slug}" already exists. Please choose a slightly different name.`);
      process.exit(1);
    }

    // 3. Create Organization
    const orgRef = await db.collection('organizations').add({
      name: orgName,
      slug: slug,
      theme: 'default',
      createdAt: new Date()
    });
    console.log(`✔ Organization created with ID: ${orgRef.id}`);

    // 4. Create/Get User in Authentication
    let uid;
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
      console.log(`ℹ User ${email} already exists. Updating profile...`);
    } catch (e) {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: orgName + ' Admin',
      });
      uid = userRecord.uid;
      console.log(`✔ User ${email} created.`);
    }

    // 5. Create/Update User Profile in Firestore
    await db.collection('users').doc(uid).set({
      email,
      name: orgName + ' Admin',
      role: 'admin',
      organizationId: orgRef.id,
      createdAt: new Date()
    });
    console.log(`✔ User profile linked to Organization.`);

    // 6. Create Default Menu Categories & Example Items in Sub-collections
    const categories = ['Burger', 'Pizza', 'Drinks'];
    const batch = db.batch();
    
    categories.forEach((cat, index) => {
        // Use sub-collection: organizations/{orgId}/categories
        const catRef = orgRef.collection('categories').doc();
        batch.set(catRef, {
            name: cat,
            order: index,
            createdAt: new Date()
        });

        // Add an example item to the first category
        if (index === 0) {
            const itemRef = orgRef.collection('items').doc();
            batch.set(itemRef, {
                name: 'Classic Burger',
                price: 12.99,
                description: 'Juicy beef patty with cheese',
                categoryId: catRef.id,
                available: true,
                organizationId: orgRef.id, // Keep redundant ID for easy global querying if ever needed
                createdAt: new Date()
            });
        }
    });

    await batch.commit();
    console.log(`✔ Default categories and example items created in organization sub-collections.`);

    console.log('\n=======================================');
    console.log('SETUP COMPLETE');
    console.log(`Organization: ${orgName}`);
    console.log(`Slug:         ${slug}`);
    console.log(`Admin Login:  ${email}`);
    console.log('=======================================\n');

  } catch (error) {
    console.error('Setup Failed:', error);
    process.exit(1);
  }
};

createOrganizationAndUser();
