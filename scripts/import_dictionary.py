import sqlite3
import csv
import os

csv_path = 'data/ecdict.csv'
db_path = 'data/dictionary.db'

# 删除旧数据库
if os.path.exists(db_path):
    os.remove(db_path)

# 创建数据库连接
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 创建表
cursor.execute('''
CREATE TABLE dictionary (
    word TEXT PRIMARY KEY,
    phonetic TEXT,
    definition TEXT,
    translation TEXT,
    pos TEXT,
    collins INTEGER,
    oxford INTEGER,
    tag TEXT,
    bnc INTEGER,
    frq INTEGER,
    exchange TEXT
)
''')

# 创建索引
cursor.execute('CREATE INDEX idx_word ON dictionary(word)')

print('正在导入词典数据...')

# 读取CSV并导入
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    batch = []
    count = 0
    
    for row in reader:
        batch.append((
            row.get('word', ''),
            row.get('phonetic', ''),
            row.get('definition', ''),
            row.get('translation', ''),
            row.get('pos', ''),
            int(row.get('collins', 0) or 0),
            int(row.get('oxford', 0) or 0),
            row.get('tag', ''),
            int(row.get('bnc', 0) or 0),
            int(row.get('frq', 0) or 0),
            row.get('exchange', ''),
        ))
        
        if len(batch) >= 10000:
            cursor.executemany('''
                INSERT OR IGNORE INTO dictionary 
                (word, phonetic, definition, translation, pos, collins, oxford, tag, bnc, frq, exchange)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', batch)
            conn.commit()
            batch = []
            count += 10000
            print(f'已导入 {count} 条...')

# 导入剩余数据
if batch:
    cursor.executemany('''
        INSERT OR IGNORE INTO dictionary 
        (word, phonetic, definition, translation, pos, collins, oxford, tag, bnc, frq, exchange)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', batch)
    conn.commit()

# 检查结果
cursor.execute('SELECT COUNT(*) FROM dictionary')
total = cursor.fetchone()[0]

conn.close()

print(f'\n导入完成！共 {total} 条词条')
print(f'数据库文件: {db_path}')
