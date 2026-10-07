import { Router, Request, Response } from 'express';
import db from '../database.js';

const router = Router();

router.get('/plans', (req: Request, res: Response) => {
  const { mold_id, type, page = '1', pageSize = '20' } = req.query;
  let sql = 'SELECT mp.*, m.code as mold_code, m.name as mold_name FROM maintenance_plans mp LEFT JOIN molds m ON mp.mold_id = m.id WHERE 1=1';
  const params: any[] = [];
  if (mold_id) { sql += ' AND mp.mold_id = ?'; params.push(mold_id); }
  if (type) { sql += ' AND mp.type = ?'; params.push(type); }
  const total = (db.prepare(sql.replace('SELECT mp.*, m.code as mold_code, m.name as mold_name', 'SELECT COUNT(*) as total')).get(...params) as any).total;
  sql += ' ORDER BY mp.next_date ASC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  const list = db.prepare(sql).all(...params);
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/plans', (req: Request, res: Response) => {
  const { mold_id, type, cycle_days, last_date, next_date, content, responsible } = req.body;
  const result = db.prepare(
    'INSERT INTO maintenance_plans (mold_id,type,cycle_days,last_date,next_date,content,responsible) VALUES (?,?,?,?,?,?,?)'
  ).run(mold_id, type, cycle_days || 30, last_date || null, next_date || null, content || null, responsible || null);
  const plan = db.prepare('SELECT mp.*, m.code as mold_code, m.name as mold_name FROM maintenance_plans mp LEFT JOIN molds m ON mp.mold_id = m.id WHERE mp.id = ?').get(result.lastInsertRowid);
  res.status(201).json(plan);
});

router.put('/plans/:id', (req: Request, res: Response) => {
  const { mold_id, type, cycle_days, last_date, next_date, content, responsible } = req.body;
  db.prepare(
    'UPDATE maintenance_plans SET mold_id=?,type=?,cycle_days=?,last_date=?,next_date=?,content=?,responsible=? WHERE id=?'
  ).run(mold_id, type, cycle_days || 30, last_date || null, next_date || null, content || null, responsible || null, req.params.id);
  const plan = db.prepare('SELECT mp.*, m.code as mold_code, m.name as mold_name FROM maintenance_plans mp LEFT JOIN molds m ON mp.mold_id = m.id WHERE mp.id = ?').get(req.params.id);
  res.json(plan);
});

router.delete('/plans/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM maintenance_plans WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/records', (req: Request, res: Response) => {
  const { mold_id, type, page = '1', pageSize = '20' } = req.query;
  let sql = 'SELECT mr.*, m.code as mold_code, m.name as mold_name FROM maintenance_records mr LEFT JOIN molds m ON mr.mold_id = m.id WHERE 1=1';
  const params: any[] = [];
  if (mold_id) { sql += ' AND mr.mold_id = ?'; params.push(mold_id); }
  if (type) { sql += ' AND mr.type = ?'; params.push(type); }
  const total = (db.prepare(sql.replace('SELECT mr.*, m.code as mold_code, m.name as mold_name', 'SELECT COUNT(*) as total')).get(...params) as any).total;
  sql += ' ORDER BY mr.maintenance_date DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  const list = db.prepare(sql).all(...params);
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/records', (req: Request, res: Response) => {
  const { mold_id, plan_id, maintenance_date, type, content, operator, result, cost, next_date } = req.body;
  const txn = db.transaction(() => {
    const r = db.prepare(
      'INSERT INTO maintenance_records (mold_id,plan_id,maintenance_date,type,content,operator,result,cost,next_date) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(mold_id, plan_id || null, maintenance_date, type, content || null, operator || null, result || null, cost || 0, next_date || null);
    if (plan_id) {
      db.prepare("UPDATE maintenance_plans SET last_date = ?, next_date = ? WHERE id = ?").run(maintenance_date, next_date || null, plan_id);
    }
    return r;
  });
  const result2 = txn();
  const record = db.prepare('SELECT mr.*, m.code as mold_code, m.name as mold_name FROM maintenance_records mr LEFT JOIN molds m ON mr.mold_id = m.id WHERE mr.id = ?').get(result2.lastInsertRowid);
  res.status(201).json(record);
});

router.delete('/records/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM maintenance_records WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
