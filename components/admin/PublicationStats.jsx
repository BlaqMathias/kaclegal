import { formatNaira } from '@/lib/publications';

export default function PublicationStats({
  totalPublications,
  freePublications,
  paidPublications,
  totalFreeDownloads,
  totalRevenue,
  salesThisMonth,
  downloadsThisMonth,
  bestSeller,
}) {
  const stats = [
    { label: 'Total Publications', value: totalPublications },
    { label: 'Free Publications', value: freePublications },
    { label: 'Paid Publications', value: paidPublications },
    { label: 'Free Downloads', value: totalFreeDownloads },
    { label: 'Total Revenue', value: formatNaira(totalRevenue) },
    { label: 'Sales This Month', value: salesThisMonth },
    { label: 'Downloads This Month', value: downloadsThisMonth },
    { label: 'Best Seller', value: bestSeller, compact: true },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border border-white/10 bg-white/5 px-6 py-5 text-center"
        >
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-white/60">
            {stat.label}
          </p>
          <p
            className={`mt-2 font-display text-white ${
              stat.compact ? 'text-h4' : 'text-h1'
            }`}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
