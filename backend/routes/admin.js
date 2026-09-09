import express from "express";
import { readDb, writeDb } from "../data/db.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken, requireAdmin);

router.get("/admin/dashboard", (req, res) => {
  const db = readDb();
  res.json({
    menu: db.menu || [],
    orders: db.orders || [],
    restaurants: db.restaurants || [],
    users: (db.users || []).map(({ password, ...user }) => ({
      ...user,
      orderCount: (db.orders || []).filter((order) => order.userId === user.id)
        .length,
    })),
  });
});

router.patch("/admin/orders/status", (req, res) => {
  const allowedStatuses = ["Accepted", "Declined"];
  const { status } = req.body;
  if (!allowedStatuses.includes(status))
    return res
      .status(400)
      .json({ error: "Bulk status must be Accepted or Declined." });

  const db = readDb();
  db.orders.forEach((order) => {
    if (!order.status || order.status === "Pending") order.status = status;
  });
  writeDb(db);
  res.json({ updated: db.orders.length });
});

router.post("/admin/menu", (req, res) => {
  const {
    name,
    restaurantName,
    price,
    image = "images/hero-food.jpg",
  } = req.body;
  if (
    !name ||
    !restaurantName ||
    !Number.isFinite(Number(price)) ||
    Number(price) <= 0
  ) {
    return res
      .status(400)
      .json({ error: "Name, restaurant, and a positive price are required." });
  }

  const db = readDb();
  const restaurant = db.restaurants.find(
    (item) => item.name.toLowerCase() === restaurantName.toLowerCase(),
  );
  const item = {
    id: db.menu.length
      ? Math.max(...db.menu.map((menuItem) => menuItem.id)) + 1
      : 1,
    restaurantId: restaurant?.id || null,
    restaurantName,
    name,
    price: Number(price),
    image,
  };
  db.menu.push(item);
  writeDb(db);
  res.status(201).json(item);
});

router.delete("/admin/menu/:id", (req, res) => {
  const db = readDb();
  const index = db.menu.findIndex((item) => String(item.id) === req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "Menu item not found." });
  const [removed] = db.menu.splice(index, 1);
  writeDb(db);
  res.json(removed);
});

router.patch("/admin/users/:id/block", (req, res) => {
  const db = readDb();
  const user = db.users.find((item) => String(item.id) === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  user.blocked = req.body.blocked !== false;
  writeDb(db);
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

router.patch("/admin/orders/:id", (req, res) => {
  const allowedStatuses = [
    "Pending",
    "Accepted",
    "Preparing",
    "Delivered",
    "Declined",
    "Cancelled",
  ];
  const { status } = req.body;
  if (!allowedStatuses.includes(status)) {
    return res
      .status(400)
      .json({ error: `Status must be one of: ${allowedStatuses.join(", ")}.` });
  }

  const db = readDb();
  const order = db.orders.find((item) => String(item.id) === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });

  order.status = status;
  writeDb(db);
  res.json(order);
});

export default router;
