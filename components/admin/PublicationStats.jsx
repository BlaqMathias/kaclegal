/**
 * PublicationStats — the three headline numbers at the top of the admin
 * publications page, styled after the MOTAC admin dashboard's stat-card row.
 *
 * All three numbers are computed by the server page from data it already
 * fetched for the grid below — this component is purely presentational.
 *
 * @param {object} props
 * @param {number} props.totalPublications - Every publication row, any status.
 * @param {number} props.completedTransactions - Count of `transactions` rows with status = 'completed'.
 * @param {number} props.totalFreeDownloads - Sum of `download_count` across every free publication.
 */
export default function PublicationStats({
  totalPublications,
  completedTransactions,
  totalFreeDownloads,
}) {
  const stats = [
    { label: "Total Publications", value: totalPublications },
    { label: "Completed Transactions", value: completedTransactions },
    { label: "Free Downloads", value: totalFreeDownloads },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border border-white/10 bg-white/5 px-6 py-5 text-center"
        >
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-white/60">
            {stat.label}
          </p>
          <p className="mt-2 font-display text-h1 text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
