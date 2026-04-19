import { Router } from "express";
import { db } from "@workspace/db";
import { flavors, itemTypes, orders, orderItems } from "@workspace/db/schema/index.js";
import { eq, lt } from "drizzle-orm";

const router: any = Router();

// GET all data needed for AppContext
router.get("/data", async (req: any, res: any) => {
  try {
    const allFlavors = await db.select().from(flavors);
    const allItemTypes = await db.select().from(itemTypes);
    const allOrders = await db.select().from(orders);
    const allOrderItems = await db.select().from(orderItems);

    const ordersWithItems = allOrders.map(o => ({
      ...o,
      items: allOrderItems.filter(i => i.orderId === o.id)
    }));

    res.json({
      flavors: allFlavors,
      itemTypes: allItemTypes,
      orders: ordersWithItems,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Flavors
router.post("/flavors", async (req: any, res: any) => {
  await db.insert(flavors).values(req.body);
  res.json({ success: true });
});
router.put("/flavors/:id", async (req: any, res: any) => {
  await db.update(flavors).set(req.body).where(eq(flavors.id, req.params.id));
  res.json({ success: true });
});
router.delete("/flavors/:id", async (req: any, res: any) => {
  await db.delete(flavors).where(eq(flavors.id, req.params.id));
  res.json({ success: true });
});

// Item Types
router.post("/itemTypes", async (req: any, res: any) => {
  await db.insert(itemTypes).values(req.body);
  res.json({ success: true });
});
router.put("/itemTypes/:id", async (req: any, res: any) => {
  await db.update(itemTypes).set({ price: req.body.price }).where(eq(itemTypes.id, req.params.id));
  res.json({ success: true });
});

// Orders
router.post("/orders", async (req: any, res: any) => {
  try {
    const { id, createdAt, completed, items, customerName } = req.body;
    console.log(`Creating order ${id} for ${customerName}`);
    
    await db.insert(orders).values({ id, createdAt: new Date(createdAt), completed, customerName });
    
    if (items && items.length > 0) {
      await db.insert(orderItems).values(items.map((i: any) => ({
        id: i.id,
        orderId: id,
        typeId: i.typeId,
        quantity: i.quantity,
        flavorIds: i.flavorIds
      })));
    }
    
    console.log(`Order ${id} saved successfully`);
    res.json({ success: true });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to save order", details: error });
  }
});

router.delete("/orders/:id", async (req: any, res: any) => {
  await db.delete(orderItems).where(eq(orderItems.orderId, req.params.id));
  await db.delete(orders).where(eq(orders.id, req.params.id));
  res.json({ success: true });
});

router.put("/orders/:id/complete", async (req: any, res: any) => {
  try {
    const { paymentMode, finalAmount } = req.body;
    console.log(`Completing order ${req.params.id} with mode: ${paymentMode}`);
    await db.update(orders).set({ completed: true, paymentMode, finalAmount }).where(eq(orders.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error completing order:", error);
    res.status(500).json({ error: "Failed to complete order" });
  }
});

// Order Items
router.post("/orders/:id/items", async (req: any, res: any) => {
  const items = req.body.items;
  if (items && items.length > 0) {
    await db.insert(orderItems).values(items.map((i: any) => ({
      ...i, orderId: req.params.id
    })));
  }
  res.json({ success: true });
});

router.put("/orders/:id/items/:itemId", async (req: any, res: any) => {
  await db.update(orderItems).set(req.body).where(eq(orderItems.id, req.params.itemId));
  res.json({ success: true });
});

router.delete("/orders/:id/items/:itemId", async (req: any, res: any) => {
  await db.delete(orderItems).where(eq(orderItems.id, req.params.itemId));
  res.json({ success: true });
});

export default router;
