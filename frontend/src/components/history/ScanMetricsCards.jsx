import { Layers, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import KpiCard from '../ui/KpiCard';

export const ScanMetricsCards = ({ stats }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
            <KpiCard
                title="Total Scans"
                value={stats.total}
                icon={<Layers />}
                color="blue"
                subtitle="Recorded scan events"
            />
            <KpiCard
                title="Clean / Valid"
                value={stats.halal}
                icon={<CheckCircle2 />}
                color="emerald"
                subtitle="No prohibited / valid cert"
            />
            <KpiCard
                title="Doubtful Scans"
                value={stats.doubtful}
                icon={<AlertTriangle />}
                color="amber"
                subtitle="Require origin review"
            />
            <KpiCard
                title="Unverified"
                value={stats.unverified || 0}
                icon={<Info />}
                color="gray"
                subtitle="Incomplete or unmatched"
            />
            <KpiCard
                title="Prohibited"
                value={stats.prohibited}
                icon={<XCircle />}
                color="rose"
                subtitle="Haram / expired / invalid"
            />
        </div>
    );
};

export default ScanMetricsCards;
