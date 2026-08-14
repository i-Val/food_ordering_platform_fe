import express from 'express';
import { readDb } from '../data/db.js';

const router = express.Router();

/**
 * @openapi
 * /api/menu:
 *   get:
 *     summary: Retrieve the list of all menu items
 *     tags: [Menu & Restaurants]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         schema:
 *           type: integer
 *         description: Filter menu items by a specific restaurant ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query matching menu item name or restaurant name
 *     responses:
 *       200:
 *         description: A list of menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   restaurantId:
 *                     type: integer
 *                   restaurantName:
 *                     type: string
 *                   name:
 *                     type: string
 *                   price:
 *                     type: integer
 *                   image:
 *                     type: string
 */
router.get('/menu', (req, res) => {
  try {
    const db = readDb();
    let menu = db.menu || [];

    const { restaurantId, search } = req.query;

    if (restaurantId) {
      const rId = parseInt(restaurantId, 10);
      menu = menu.filter(item => item.restaurantId === rId);
    }

    if (search) {
      const query = search.toLowerCase().trim();
      menu = menu.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.restaurantName.toLowerCase().includes(query)
      );
    }

    res.json(menu);
  } catch (error) {
    console.error('Fetch menu error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * @openapi
 * /api/restaurants:
 *   get:
 *     summary: Retrieve the list of popular restaurants
 *     tags: [Menu & Restaurants]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query matching restaurant name, tags, or cuisine
 *     responses:
 *       200:
 *         description: A list of restaurants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   rating:
 *                     type: number
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                   deliveryTime:
 *                     type: string
 *                   deliveryFee:
 *                     type: integer
 *                   image:
 *                     type: string
 */
router.get('/restaurants', (req, res) => {
  try {
    const db = readDb();
    let restaurants = db.restaurants || [];

    const { search } = req.query;

    if (search) {
      const query = search.toLowerCase().trim();
      restaurants = restaurants.filter(resto =>
        resto.name.toLowerCase().includes(query) ||
        resto.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    res.json(restaurants);
  } catch (error) {
    console.error('Fetch restaurants error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
