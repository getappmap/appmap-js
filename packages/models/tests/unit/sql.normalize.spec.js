import normalize from '../../src/sql/normalize';

describe('normalize SQL', () => {
  test('replaces literals for a known dialect', () => {
    expect(normalize("SELECT * FROM users WHERE id = 1 AND name = 'bob'", 'postgres')).toEqual(
      'SELECT * FROM users WHERE id = ? AND name = ?'
    );
  });

  test('replaces literals with the fallback for an unknown dialect', () => {
    expect(normalize('SELECT * FROM users WHERE id = 1', 'something')).toEqual(
      'SELECT * FROM users WHERE id = ?'
    );
  });

  test('leaves MongoDB statements alone, since the agent already normalized them', () => {
    const statements = [
      'db.users.find({"a": ?})',
      'db.users.updateOne({"_id": ?}, {"$set": {"name": ?}, "$inc": {"n": ?}}, {"upsert": ?})',
      'db.orders.aggregate([{"$match": {"status": ?}}, {"$group": {"_id": ?, "total": {"$sum": ?}}}])',
      'db.getCollection("with-dash").insertOne({"a": ?})',
      'db.users.distinct("email", {"deleted": ?})',
    ];
    statements.forEach((statement) => {
      expect(normalize(statement, 'mongodb')).toEqual(statement);
    });
  });
});
