import type { ClientSession, Connection } from 'mongoose';

export async function withMongoTransaction<T>(
  connection: Connection,
  work: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = await connection.startSession();
  try {
    session.startTransaction({
      readConcern: { level: 'local' },
      writeConcern: { w: 1 },
      readPreference: 'primary',
    });
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    throw error;
  } finally {
    void session.endSession();
  }
}
