import express from 'express';
import { readDb, writeDb } from '../data/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: Place a new food order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantName
 *               - items
 *               - fullName
 *               - address
 *               - phone
 *             properties:
 *               restaurantName:
 *                 type: string
 *                 example: Mama Ngozi's Kitchen
 *               fullName:
 *                 type: string
 *                 example: Ofure Itulah
 *               address:
 *                 type: string
 *                 example: 12 Aso Drive, Abuja
 *               phone:
 *                 type: string
 *                 example: "08012345678"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - price
 *                     - quantity
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Jollof Rice + Chicken
 *                     price:
 *                       type: integer
 *                       example: 3500
 *                     quantity:
 *                       type: integer
 *                       example: 1
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 userId:
 *                   type: integer
 *                 restaurantName:
 *                   type: string
 *                 items:
 *                   type: array
 *                 total:
 *                   type: integer
 *                 date:
 *                   type: string
 *                 deliveryAddress:
 *                   type: string
 *                 fullName:
 *                   type: string
 *                 phone:
 *                   type: string
 *       400:
 *         description: Invalid or empty order details
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 */
router.post('/orders', authenticateToken, (req, res) => {
  try {
    const { restaurantName, items, fullName, address, phone } = req.body;
    const userId = req.user.id;

    if (!restaurantName || !items || !Array.isArray(items) || items.length === 0 || !fullName || !address || !phone) {
      return res.status(400).json({ error: 'Order details are incomplete. Make sure you specify restaurantName, items, fullName, address, and phone.' });
    }

    let total = 0;
    for (const item of items) {
      if (!item.name || !item.price || !item.quantity) {
        return res.status(400).json({ error: 'Each item must have a name, price, and quantity.' });
      }
      total += item.price * item.quantity;
    }

    const db = readDb();
    const newOrder = {
      id: db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1,
      userId,
      restaurantName,
      items,
      total,
      date: new Date().toISOString(),
      deliveryAddress: address,
      fullName,
      phone
    };

    db.orders.push(newOrder);
    writeDb(db);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: Retrieve order history for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of orders placed by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   userId:
 *                     type: integer
 *                   restaurantName:
 *                     type: string
 *                   total:
 *                     type: integer
 *                   date:
 *                     type: string
 *                   items:
 *                     type: array
 *       401:
 *         description: Unauthorized
 */
router.get('/orders', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const db = readDb();
    const userOrders = db.orders.filter(o => o.userId === userId);

    // Sort by date descending
    userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(userOrders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
