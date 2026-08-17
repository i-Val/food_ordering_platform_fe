import express from 'express';
import { readDb } from '../data/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @openapi
 * /api/profile:
 *   get:
 *     summary: Get profile info and statistics for the logged-in user
 *     tags: [Profile]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data and statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fullName:
 *                   type: string
 *                   example: Ofure Itulah
 *                 email:
 *                   type: string
 *                   example: ofure@example.com
 *                 rating:
 *                   type: number
 *                   example: 4.9
 *                 savedSpotsCount:
 *                   type: integer
 *                   example: 3
 *                 ordersCount:
 *                   type: integer
 *                   example: 14
 *                 totalSpent:
 *                   type: number
 *                   example: 250300.90
 *                 recentOrders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       restaurantName:
 *                         type: string
 *                       total:
 *                         type: number
 *                       date:
 *                         type: string
 *                       itemCount:
 *                         type: integer
 *                       itemsSummary:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const db = readDb();
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const userOrders = db.orders.filter(o => o.userId === userId);

    // Calculate dynamic stats
    const ordersCount = userOrders.length;
    const totalSpent = userOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    // Format recent orders
    const recentOrders = userOrders
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(order => {
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const itemsSummary = order.items.map(item => `${item.name}${item.quantity > 1 ? ` x ${item.quantity}` : ''}`).join(', ');

        return {
          id: order.id,
          restaurantName: order.restaurantName,
          total: order.total,
          date: order.date,
          itemCount,
          itemsSummary
        };
      });

    res.json({
      fullName: user.fullName,
      email: user.email,
      rating: user.rating || 5.0,
      savedSpotsCount: user.savedSpotsCount || 0,
      ordersCount,
      totalSpent,
      recentOrders
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
