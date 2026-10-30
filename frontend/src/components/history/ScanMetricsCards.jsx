import { Layers, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import KpiCard from '../ui/KpiCard';

export const ScanMetricsCards = ({ stats }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            <KpiCard
                title="Total Scans"
                value={stats.total}
                icon={<Layers />}
                color="blue"
                subtitle="Recorded scan events"
            />
            <KpiCard
                title="Halal Verified"
                value={stats.halal}
                icon={<CheckCircle2 />}
                color="emerald"
                subtitle="Passed verification"
            />
            <KpiCard
                title="Doubtful Scans"
                value={stats.doubtful}
                icon={<AlertTriangle />}
                color="amber"
                subtitle="Require origin review"
            />
            <KpiCard
                title="Prohibited"
                value={stats.prohibited}
                icon={<XCircle />}
                color="rose"
                subtitle="Non-compliant items"
            />
        </div>
    );
};

export default ScanMetricsCards;
