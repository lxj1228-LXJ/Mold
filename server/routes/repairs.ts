import { Router, Request, Response } from 'express';
import db from '../database.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { keyword, status, urgency, page = '1', pageSize = '20' } = req.query;
  let sql = 'SELECT r.*, m.code as mold_code, m.name as mold_name FROM repairs r LEFT JOIN molds m ON r.mold_id = m.id WHERE 1=1';
  const params: any[] = [];
  if (keyword) { sql += ' AND (m.code LIKE ? OR m.name LIKE ? OR r.fault_description LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  if (urgency) { sql += ' AND r.urgency = ?'; params.push(urgency); }
  const total = (db.prepare(sql.replace('SELECT r.*, m.code as mold_code, m.name as mold_name', 'SELECT COUNT(*) as total')).get(...params) as any).total;
  sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  const list = db.prepare(sql).all(...params);
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/:id', (req: Request, res: Response) => {
  const repair = db.prepare('SELECT r.*, m.code as mold_code, m.name as mold_name FROM repairs r LEFT JOIN molds m ON r.mold_id = m.id WHERE r.id = ?').get(req.params.id);
  if (!repair) return res.status(404).json({ message: '维修记录不存在' });
  const usage = db.prepare('SELECT pu.*, sp.code as part_code, sp.name as part_name, sp.unit FROM parts_usage pu LEFT JOIN spare_parts sp ON pu.part_id = sp.id WHERE pu.repair_id = ?').all(req.params.id);
  res.json({ ...(repair as any), parts_usage: usage });
});

router.post('/', (req: Request, res: Response) => {
  const { mold_id, report_date, fault_description, fault_type, urgency, repair_date, repair_content, repair_person, cost, status, result } = req.body;
  const txn = db.transaction(() => {
    const r = db.prepare(
      'INSERT INTO repairs (mold_id,report_date,fault_description,fault_type,urgency,repair_date,repair_content,repair_person,cost,status,result) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    ).run(mold_id, report_date, fault_description || null, fault_type || null, urgency || 'normal', repair_date || null, repair_content || null, repair_person || null, cost || 0, status || 'pending', result || null);
    if (status === 'completed' || status === 'verified') {
      db.prepare("UPDATE molds SET status = 'idle', updated_at = datetime('now','localtime') WHERE id = ?").run(mold_id);
    } else {
      db.prepare("UPDATE molds SET status = 'repair', updated_at = datetime('now','localtime') WHERE id = ?").run(mold_id);
    }
    return r;
  });
  const result2 = txn();
  const repair = db.prepare('SELECT r.*, m.code as mold_code, m.name as mold_name FROM repairs r LEFT JOIN molds m ON r.mold_id = m.id WHERE r.id = ?').get(result2.lastInsertRowid);
  res.status(201).json(repair);
});

router.put('/:id', (req: Request, res: Response) => {
  const { mold_id, report_date, fault_description, fault_type, urgency, repair_date, repair_content, repair_person, cost, status, result, completion_date } = req.body;
  const txn = db.transaction(() => {
    db.prepare(
      "UPDATE repairs SET mold_id=?,report_date=?,fault_description=?,fault_type=?,urgency=?,repair_date=?,repair_content=?,repair_person=?,cost=?,status=?,result=?,completion_date=? WHERE id=?"
    ).run(mold_id, report_date, fault_description || null, fault_type || null, urgency || 'normal', repair_date || null, repair_content || null, repair_person || null, cost || 0, status || 'pending', result || null, completion_date || null, req.params.id);
    if (status === 'completed' || status === 'verified') {
      db.prepare("UPDATE molds SET status = 'idle', updated_at = datetime('now','localtime') WHERE id = ?").run(mold_id);
    } else if (status === 'in_progress' || status === 'pending') {
      db.prepare("UPDATE molds SET status = 'repair', updated_at = datetime('now','localtime') WHERE id = ?").run(mold_id);
    }
  });
  txn();
  const repair = db.prepare('SELECT r.*, m.code as mold_code, m.name as mold_name FROM repairs r LEFT JOIN molds m ON r.mold_id = m.id WHERE r.id = ?').get(req.params.id);
  res.json(repair);
});

router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM repairs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
