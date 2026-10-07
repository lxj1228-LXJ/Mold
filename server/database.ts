import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'mold.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS molds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    spec TEXT,
    category TEXT,
    status TEXT DEFAULT 'idle',
    location TEXT,
    manufacturer TEXT,
    purchase_date TEXT,
    warranty_date TEXT,
    expected_life INTEGER DEFAULT 0,
    current_life INTEGER DEFAULT 0,
    remark TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS maintenance_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mold_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    cycle_days INTEGER DEFAULT 30,
    last_date TEXT,
    next_date TEXT,
    content TEXT,
    responsible TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (mold_id) REFERENCES molds(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS maintenance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mold_id INTEGER NOT NULL,
    plan_id INTEGER,
    maintenance_date TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    operator TEXT,
    result TEXT,
    cost REAL DEFAULT 0,
    next_date TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (mold_id) REFERENCES molds(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS repairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mold_id INTEGER NOT NULL,
    report_date TEXT NOT NULL,
    fault_description TEXT,
    fault_type TEXT,
    urgency TEXT DEFAULT 'normal',
    repair_date TEXT,
    repair_content TEXT,
    repair_person TEXT,
    cost REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    result TEXT,
    completion_date TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (mold_id) REFERENCES molds(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS spare_parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    spec TEXT,
    category TEXT,
    unit TEXT DEFAULT '个',
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    price REAL DEFAULT 0,
    supplier TEXT,
    remark TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS parts_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repair_id INTEGER NOT NULL,
    part_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (repair_id) REFERENCES repairs(id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES spare_parts(id) ON DELETE CASCADE
  );
`);

const seedCount = (db.prepare('SELECT COUNT(*) as c FROM molds').get() as any).c;
if (seedCount === 0) {
  const insertMold = db.prepare(`INSERT INTO molds (code,name,spec,category,status,location,manufacturer,purchase_date,warranty_date,expected_life,current_life) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const insertPart = db.prepare(`INSERT INTO spare_parts (code,name,spec,category,unit,stock,min_stock,price,supplier) VALUES (?,?,?,?,?,?,?,?,?)`);
  const insertPlan = db.prepare(`INSERT INTO maintenance_plans (mold_id,type,cycle_days,last_date,next_date,content,responsible) VALUES (?,?,?,?,?,?,?)`);

  const seedMolds = db.transaction(() => {
    insertMold.run('MJ-001','前保险杠模具','1200×800×600mm','注塑模','in_use','A区-01','东方模具厂','2023-03-15','2025-03-15',100000,65000);
    insertMold.run('MJ-002','后保险杠模具','1100×750×550mm','注塑模','maintenance','A区-02','东方模具厂','2023-05-20','2025-05-20',100000,48000);
    insertMold.run('MJ-003','左车门内板模具','1500×1000×800mm','冲压模','repair','B区-01','精密模具公司','2022-11-10','2024-11-10',200000,156000);
    insertMold.run('MJ-004','右车门内板模具','1500×1000×800mm','冲压模','idle','B区-02','精密模具公司','2022-11-10','2024-11-10',200000,142000);
    insertMold.run('MJ-005','仪表板模具','1300×900×700mm','注塑模','in_use','A区-03','华诚精密','2024-01-08','2026-01-08',80000,22000);
    insertMold.run('MJ-006','发动机罩模具','1600×1200×500mm','冲压模','idle','B区-03','东方模具厂','2023-08-22','2025-08-22',150000,55000);
    insertMold.run('MJ-007','行李箱盖模具','1400×1000×400mm','冲压模','maintenance','B区-04','华诚精密','2023-06-15','2025-06-15',150000,98000);
    insertMold.run('MJ-008','前大灯灯罩模具','400×300×200mm','注塑模','in_use','C区-01','光明模具','2024-04-01','2026-04-01',50000,12000);
    insertMold.run('MJ-009','散热格栅模具','800×500×300mm','注塑模','scrapped','A区-04','东方模具厂','2020-02-10','2022-02-10',80000,82000);
    insertMold.run('MJ-010','翼子板模具','1200×800×600mm','冲压模','in_use','B区-05','精密模具公司','2024-06-18','2026-06-18',120000,18000);
  });

  const seedParts = db.transaction(() => {
    insertPart.run('BJ-001','顶针','Φ10×100mm','成型零件','个',50,10,15,'标准件供应');
    insertPart.run('BJ-002','弹簧','Φ20×50mm','弹性元件','个',30,10,8.5,'标准件供应');
    insertPart.run('BJ-003','密封圈','Φ50×3mm','密封元件','个',100,20,3,'标准件供应');
    insertPart.run('BJ-004','导柱','Φ25×150mm','导向零件','根',8,5,120,'精密配件');
    insertPart.run('BJ-005','导套','Φ25×80mm','导向零件','个',6,5,85,'精密配件');
    insertPart.run('BJ-006','冷却水管接头','G1/2','冷却系统','个',5,10,25,'标准件供应');
    insertPart.run('BJ-007','加热棒','Φ12×200mm','加热系统','根',3,5,200,'电热器材');
    insertPart.run('BJ-008','热电偶','K型 L=100mm','温控元件','个',4,3,150,'电热器材');
  });

  const seedPlans = db.transaction(() => {
    insertPlan.run(1,'monthly',30,'2026-09-10','2026-10-10','常规保养：清洗分型面、检查顶出系统、润滑导柱导套','张工');
    insertPlan.run(2,'monthly',30,'2026-09-15','2026-10-15','常规保养：清洗型腔、检查冷却水路','李工');
    insertPlan.run(5,'weekly',7,'2026-10-01','2026-10-08','日常保养：清洁表面、检查温度','张工');
    insertPlan.run(7,'monthly',30,'2026-09-05','2026-10-05','常规保养：检查冲压间隙、润滑','王工');
    insertPlan.run(8,'weekly',7,'2026-10-03','2026-10-10','日常保养：清洁灯罩型腔','李工');
    insertPlan.run(10,'monthly',30,'2026-09-20','2026-10-20','常规保养：检查冲压刃口、润滑','王工');
  });

  seedMolds();
  seedParts();
  seedPlans();
}

export default db;
