import prisma from '@/lib/prisma';

export default async function TestMKCheckPage() {
  const totalMKs = await prisma.mK.count();

  const positionCounts = await prisma.mK.groupBy({
    by: ['currentPosition'],
    _count: { id: true }
  });

  const sampleMKs = await prisma.mK.findMany({
    take: 10,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      nameHe: true,
      faction: true,
      currentPosition: true,
      photoUrl: true
    }
  });

  const noPhotoCount = await prisma.mK.count({
    where: { photoUrl: null }
  });

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">🔍 בדיקת מסד נתונים - MK</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📊 סטטיסטיקה כללית</h2>
        <p className="mb-2"><strong>סה״כ ח״כים:</strong> {totalMKs}</p>
        <p className="mb-2"><strong>ח״כים ללא תמונה:</strong> {noPhotoCount}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📈 התפלגות עמדות</h2>
        <ul className="space-y-2">
          {positionCounts.map((p) => (
            <li key={p.currentPosition}>
              <strong>{p.currentPosition}:</strong> {p._count.id} ח״כים
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">👥 דוגמה - 10 ח״כים ראשונים</h2>
        <div className="space-y-3">
          {sampleMKs.map((mk) => (
            <div key={mk.id} className="border-b pb-3">
              <p><strong>ID:</strong> {mk.id}</p>
              <p><strong>שם:</strong> {mk.nameHe}</p>
              <p><strong>סיעה:</strong> {mk.faction}</p>
              <p><strong>עמדה:</strong> {mk.currentPosition}</p>
              <p><strong>URL תמונה:</strong> {mk.photoUrl || '❌ אין תמונה'}</p>
              {mk.photoUrl && (
                <img src={mk.photoUrl} alt={mk.nameHe} className="w-20 h-20 rounded mt-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
