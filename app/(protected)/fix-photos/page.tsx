import prisma from '@/lib/prisma';

async function testPhotoUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

async function processBatch(mks: Array<{ id: number; nameHe: string; photoUrl: string | null }>) {
  const results = await Promise.all(
    mks.map(async (mk) => {
      if (!mk.photoUrl) {
        return { id: mk.id, name: mk.nameHe, status: '⚪ No URL', url: null };
      }

      const isWorking = await testPhotoUrl(mk.photoUrl);

      if (isWorking) {
        return { id: mk.id, name: mk.nameHe, status: '✅ Working', url: mk.photoUrl };
      } else {
        // Fix broken photo by setting to null
        await prisma.mK.update({
          where: { id: mk.id },
          data: { photoUrl: null },
        });
        return { id: mk.id, name: mk.nameHe, status: '❌ Fixed (was 404)', url: mk.photoUrl };
      }
    })
  );

  return results;
}

export default async function FixPhotosPage() {
  const allMKs = await prisma.mK.findMany({
    select: {
      id: true,
      nameHe: true,
      photoUrl: true,
    },
    orderBy: { id: 'asc' },
  });

  const results: Array<{ id: number; name: string; status: string; url: string | null }> = [];
  const BATCH_SIZE = 20; // Process 20 MKs at a time

  // Process in batches for better performance
  for (let i = 0; i < allMKs.length; i += BATCH_SIZE) {
    const batch = allMKs.slice(i, i + BATCH_SIZE);
    const batchResults = await processBatch(batch);
    results.push(...batchResults);
  }

  const workingCount = results.filter(r => r.status.includes('✅')).length;
  const brokenCount = results.filter(r => r.status.includes('❌')).length;
  const nullCount = results.filter(r => r.status.includes('⚪')).length;

  return (
    <div className="p-8 max-w-6xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">🔧 תיקון תמונות ח״כים</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📊 סיכום</h2>
        <div className="space-y-2">
          <p><strong>✅ תמונות תקינות:</strong> {workingCount}</p>
          <p><strong>❌ תמונות שתוקנו (404):</strong> {brokenCount}</p>
          <p><strong>⚪ ללא URL:</strong> {nullCount}</p>
          <p><strong>📝 סה״כ:</strong> {allMKs.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📋 פרטים</h2>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100">
              <tr>
                <th className="p-2 text-right">ID</th>
                <th className="p-2 text-right">שם</th>
                <th className="p-2 text-right">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4">
        <a
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          חזור לעמוד הבית
        </a>
        <a
          href="/fix-photos"
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
        >
          בדוק שוב
        </a>
      </div>
    </div>
  );
}
