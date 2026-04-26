import { Router } from "express";
import { db, flavors, itemTypes, orders, orderItems, eq, lt } from "@workspace/db";

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

// Bulk Migration Sync
router.post("/sync", async (req: any, res: any) => {
  const { flavors: newFlavors, itemTypes: newItemTypes, orders: newOrders } = req.body;
  try {
    await db.transaction(async (tx) => {
      // 1. Sync Flavors
      if (newFlavors) {
        for (const f of newFlavors) {
          await tx.insert(flavors).values(f).onConflictDoUpdate({
            target: flavors.id,
            set: f
          });
        }
      }

      // 2. Sync Item Types
      if (newItemTypes) {
        for (const t of newItemTypes) {
          await tx.insert(itemTypes).values(t).onConflictDoUpdate({
            target: itemTypes.id,
            set: t
          });
        }
      }

      // 3. Sync Orders & Items
      if (newOrders) {
        for (const o of newOrders) {
          const { items, ...orderData } = o;
          await tx.insert(orders).values(orderData).onConflictDoUpdate({
            target: orders.id,
            set: orderData
          });

          if (items && items.length > 0) {
            for (const i of items) {
              await tx.insert(orderItems).values({ ...i, orderId: o.id }).onConflictDoUpdate({
                target: orderItems.id,
                set: i
              });
            }
          }
        }
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Sync failed", err);
    res.status(500).json({ error: "Sync failed" });
  }
});

router.post("/clearOld", async (req: any, res: any) => {
  const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  // Implementation note: This will delete everything older than 1 year
  // In a real usage, we join items or cascade delete
  await db.delete(orders).where(lt(orders.createdAt, yearAgo));
  res.json({ success: true });
});

export default router;
