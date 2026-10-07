import { Router, Request, Response } from 'express';
import db from '../database.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { keyword, category, low_stock, page = '1', pageSize = '20' } = req.query;
  let sql = 'SELECT * FROM spare_parts WHERE 1=1';
  const params: any[] = [];
  if (keyword) { sql += ' AND (code LIKE ? OR name LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (low_stock === '1') { sql += ' AND stock <= min_stock'; }
  const total = (db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*) as total')).get(...params) as any).total;
  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  const list = db.prepare(sql).all(...params);
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/categories', (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT DISTINCT category FROM spare_parts WHERE category IS NOT NULL").all();
  res.json(rows.map((r: any) => r.category));
});

router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: '备件不存在' });
  res.json(row);
});

router.post('/', (req: Request, res: Response) => {
  const { code, name, spec, category, unit, stock, min_stock, price, supplier, remark } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO spare_parts (code,name,spec,category,unit,stock,min_stock,price,supplier,remark) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).run(code, name, spec || null, category || null, unit || '个', stock || 0, min_stock || 0, price || 0, supplier || null, remark || null);
    const part = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(part);
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ message: '备件编号已存在' });
    throw e;
  }
});

router.put('/:id', (req: Request, res: Response) => {
  const { code, name, spec, category, unit, stock, min_stock, price, supplier, remark } = req.body;
  try {
    db.prepare(
      "UPDATE spare_parts SET code=?,name=?,spec=?,category=?,unit=?,stock=?,min_stock=?,price=?,supplier=?,remark=?,updated_at=datetime('now','localtime') WHERE id=?"
    ).run(code, name, spec || null, category || null, unit || '个', stock || 0, min_stock || 0, price || 0, supplier || null, remark || null, req.params.id);
    const part = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(req.params.id);
    res.json(part);
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ message: '备件编号已存在' });
    throw e;
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM spare_parts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/usage', (req: Request, res: Response) => {
  const { repair_id, part_id, quantity } = req.body;
  const txn = db.transaction(() => {
    db.prepare('INSERT INTO parts_usage (repair_id,part_id,quantity) VALUES (?,?,?)').run(repair_id, part_id, quantity);
    db.prepare("UPDATE spare_parts SET stock = stock - ?, updated_at = datetime('now','localtime') WHERE id = ?").run(quantity, part_id);
  });
  txn();
  res.status(201).json({ success: true });
});

router.get('/usage/:repairId', (req: Request, res: Response) => {
  const usage = db.prepare(
    'SELECT pu.*, sp.code as part_code, sp.name as part_name, sp.unit FROM parts_usage pu LEFT JOIN spare_parts sp ON pu.part_id = sp.id WHERE pu.repair_id = ?'
  ).all(req.params.repairId);
  res.json(usage);
});

export default router;
