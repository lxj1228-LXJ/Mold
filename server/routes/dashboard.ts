import { Router, Request, Response } from 'express';
import db from '../database.js';

const router = Router();

router.get('/stats', (_req: Request, res: Response) => {
  const totalMolds = (db.prepare('SELECT COUNT(*) as c FROM molds').get() as any).c;
  const inUseMolds = (db.prepare("SELECT COUNT(*) as c FROM molds WHERE status = 'in_use'").get() as any).c;
  const maintenanceMolds = (db.prepare("SELECT COUNT(*) as c FROM molds WHERE status = 'maintenance'").get() as any).c;
  const repairMolds = (db.prepare("SELECT COUNT(*) as c FROM molds WHERE status = 'repair'").get() as any).c;
  const pendingRepairs = (db.prepare("SELECT COUNT(*) as c FROM repairs WHERE status IN ('pending','in_progress')").get() as any).c;
  const totalParts = (db.prepare('SELECT COUNT(*) as c FROM spare_parts').get() as any).c;
  const lowStockParts = (db.prepare('SELECT COUNT(*) as c FROM spare_parts WHERE stock <= min_stock').get() as any).c;
  const totalRepairCost = (db.prepare("SELECT COALESCE(SUM(cost),0) as s FROM repairs WHERE status IN ('completed','verified')").get() as any).s;
  const totalMaintenanceCost = (db.prepare('SELECT COALESCE(SUM(cost),0) as s FROM maintenance_records').get() as any).s;

  const statusDist = db.prepare("SELECT status, COUNT(*) as count FROM molds GROUP BY status").all();
  const recentRepairs = db.prepare("SELECT r.*, m.code as mold_code, m.name as mold_name FROM repairs r LEFT JOIN molds m ON r.mold_id = m.id ORDER BY r.created_at DESC LIMIT 5").all();
  const recentMaintenance = db.prepare("SELECT mr.*, m.code as mold_code, m.name as mold_name FROM maintenance_records mr LEFT JOIN molds m ON mr.mold_id = m.id ORDER BY mr.created_at DESC LIMIT 5").all();

  res.json({
    totalMolds, inUseMolds, maintenanceMolds, repairMolds,
    pendingRepairs, totalParts, lowStockParts,
    totalRepairCost, totalMaintenanceCost,
    statusDist, recentRepairs, recentMaintenance,
  });
});

router.get('/alerts', (_req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0, 10);
  const warnDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const overdueMaintenance = db.prepare(
    "SELECT mp.*, m.code as mold_code, m.name as mold_name FROM maintenance_plans mp LEFT JOIN molds m ON mp.mold_id = m.id WHERE mp.next_date IS NOT NULL AND mp.next_date < ? ORDER BY mp.next_date ASC"
  ).all(today) as any[];

  const upcomingMaintenance = db.prepare(
    "SELECT mp.*, m.code as mold_code, m.name as mold_name FROM maintenance_plans mp LEFT JOIN molds m ON mp.mold_id = m.id WHERE mp.next_date IS NOT NULL AND mp.next_date >= ? AND mp.next_date <= ? ORDER BY mp.next_date ASC"
  ).all(today, warnDate) as any[];

  const lowStockParts = db.prepare(
    'SELECT * FROM spare_parts WHERE stock <= min_stock ORDER BY (stock - min_stock) ASC'
  ).all();

  const overdueRepairs = db.prepare(
    "SELECT r.*, m.code as mold_code, m.name as mold_name FROM repairs r LEFT JOIN molds m ON r.mold_id = m.id WHERE r.status = 'pending' AND r.report_date < date('now','-7 days') ORDER BY r.report_date ASC"
  ).all();

  const alerts = [
    ...overdueMaintenance.map(m => ({ type: 'maintenance_overdue' as const, level: 'error', ...m, alert_msg: `模具 ${m.mold_code} 保养已逾期（计划日期：${m.next_date}）` })),
    ...upcomingMaintenance.map(m => ({ type: 'maintenance_upcoming' as const, level: 'warning', ...m, alert_msg: `模具 ${m.mold_code} 即将到期保养（计划日期：${m.next_date}）` })),
    ...lowStockParts.map((p: any) => ({ type: 'low_stock' as const, level: p.stock === 0 ? 'error' : 'warning', ...p, alert_msg: `备件 ${p.code} ${p.name} 库存不足（当前：${p.stock}，最低：${p.min_stock}）` })),
    ...overdueRepairs.map((r: any) => ({ type: 'repair_overdue' as const, level: 'warning', ...r, alert_msg: `模具 ${r.mold_code} 维修超7天未处理` })),
  ];

  res.json(alerts);
});

export default router;
