import { Router, Request, Response } from 'express';
import db from '../database.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { keyword, status, category, page = '1', pageSize = '20' } = req.query;
  let sql = 'SELECT * FROM molds WHERE 1=1';
  const params: any[] = [];

  if (keyword) {
    sql += ' AND (code LIKE ? OR name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = (db.prepare(countSql).get(...params) as any).total;

  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;
  params.push(limit, offset);

  const list = db.prepare(sql).all(...params);
  res.json({ list, total, page: Number(page), pageSize: limit });
});

router.get('/categories', (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT DISTINCT category FROM molds WHERE category IS NOT NULL").all();
  res.json(rows.map((r: any) => r.category));
});

router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM molds WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: '模具不存在' });
  res.json(row);
});

router.post('/', (req: Request, res: Response) => {
  const { code, name, spec, category, status, location, manufacturer, purchase_date, warranty_date, expected_life, current_life, remark } = req.body;
  try {
    const result = db.prepare(
      `INSERT INTO molds (code,name,spec,category,status,location,manufacturer,purchase_date,warranty_date,expected_life,current_life,remark) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(code, name, spec || null, category || null, status || 'idle', location || null, manufacturer || null, purchase_date || null, warranty_date || null, expected_life || 0, current_life || 0, remark || null);
    const mold = db.prepare('SELECT * FROM molds WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(mold);
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ message: '模具编号已存在' });
    throw e;
  }
});

router.put('/:id', (req: Request, res: Response) => {
  const { code, name, spec, category, status, location, manufacturer, purchase_date, warranty_date, expected_life, current_life, remark } = req.body;
  try {
    db.prepare(
      `UPDATE molds SET code=?,name=?,spec=?,category=?,status=?,location=?,manufacturer=?,purchase_date=?,warranty_date=?,expected_life=?,current_life=?,remark=?,updated_at=datetime('now','localtime') WHERE id=?`
    ).run(code, name, spec || null, category || null, status || 'idle', location || null, manufacturer || null, purchase_date || null, warranty_date || null, expected_life || 0, current_life || 0, remark || null, req.params.id);
    const mold = db.prepare('SELECT * FROM molds WHERE id = ?').get(req.params.id);
    res.json(mold);
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ message: '模具编号已存在' });
    throw e;
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM molds WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
