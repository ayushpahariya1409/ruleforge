import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineDocumentMagnifyingGlass, 
  HiOutlineArrowUpTray, 
  HiOutlineCog6Tooth,
  HiOutlineShieldCheck,
  HiOutlineArrowTrendingUp,
  HiOutlineCheckBadge
} from 'react-icons/hi2';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import Button from '../components/shared/Button';
import Spinner from '../components/shared/Spinner';
import Reveal from '../components/shared/Reveal';
import { useStats, useEvaluations } from '../hooks/useEvaluations';
import { useRules } from '../hooks/useRules';

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { data: stats, isLoading } = useStats();
  const { data: evalsData, isLoading: evalsLoading } = useEvaluations({ page: 1, limit: 10 });
  const { data: rulesData } = useRules();

  const [trendsInView, setTrendsInView] = React.useState(false);
  const [pieInView, setPieInView] = React.useState(false);
  const [ruleInView, setRuleInView] = React.useState(false);

  // Responsive logic for charts
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const trendData = (evalsData?.evaluations || [])
    .slice()
    .reverse()
    .map((e, idx) => ({
      name: `Run ${idx + 1}`,
      orders: e.totalOrders || 0,
      matches: e.totalMatches || 0,
    }));

  const matchRate = stats?.matchRate || 0;
  const donutData = [
    { name: 'Matched', value: stats?.totalMatches || 0 },
    { name: 'Unmatched', value: Math.max(0, (stats?.totalOrders || 0) - (stats?.totalMatches || 0)) },
  ];
  const DONUT_COLORS = ['#6366f1', '#e2e8f0'];

  const ruleEffectivenessData = (rulesData?.rules || [])
    .filter(r => r.isActive)
    .slice(0, 6)
    .map(r => ({
      name: r.ruleName,
      fullName: r.ruleName,
      conditions: r.conditions?.conditions?.length || 1,
    }));

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 sm:space-y-10 max-w-7xl mx-auto px-2 sm:px-0 pb-12 overflow-x-hidden">
      {/* Welcome Header */}
      <Reveal className="px-2 sm:px-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-surface-900 -tracking-tight mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-surface-500 font-medium">
              Here's your system overview for today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button 
              onClick={() => navigate('/upload')}
              icon={HiOutlineArrowUpTray}
              className="w-full sm:w-auto px-6 py-2.5 shadow-lg shadow-primary-600/10"
            >
              Upload Data
            </Button>
            {user?.role === 'admin' && (
              <Button 
                variant="secondary"
                icon={HiOutlineCog6Tooth}
                onClick={() => navigate('/rules')}
                className="w-full sm:w-auto px-6 py-2.5"
              >
                Manage Rules
              </Button>
            )}
          </div>
        </div>
      </Reveal>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-0">
        <Reveal><StatCard title="Total Records" value={stats?.totalOrders?.toLocaleString() || '0'} subtitle="Processed orders" icon={HiOutlineDocumentMagnifyingGlass} iconBg="bg-primary-50" iconColor="text-primary-600" /></Reveal>
        <Reveal><StatCard title="Active Matches" value={stats?.totalMatches?.toLocaleString() || '0'} subtitle={`${matchRate}% hit rate`} icon={HiOutlineCheckBadge} iconBg="bg-success-50" iconColor="text-success-600" /></Reveal>
        <Reveal><StatCard title="Active Rules" value={stats?.activeRules || 0} subtitle="Logic nodes" icon={HiOutlineShieldCheck} iconBg="bg-warning-50" iconColor="text-warning-600" /></Reveal>
        <Reveal><StatCard title="Evaluations" value={stats?.totalEvaluations || 0} subtitle="Completed runs" icon={HiOutlineArrowTrendingUp} iconBg="bg-surface-100" iconColor="text-surface-600" /></Reveal>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-2 sm:px-0">
        <Reveal className="lg:col-span-2" onReveal={() => setTrendsInView(true)}>
          <div className="card p-4 sm:p-6 h-full">
            <div className="mb-6">
              <h3 className="text-base font-bold text-surface-900 tracking-tight">Trends</h3>
              <p className="text-[11px] font-medium text-surface-400 mt-0.5">Orders vs Matches</p>
            </div>
            <div style={{ height: isMobile ? 200 : 260, width: '100%' }}>
              {trendData.length > 0 && trendsInView && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, left: isMobile ? -20 : -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradMatches" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={isMobile ? 9 : 10} tickLine={false} axisLine={false} dy={8} />
                    <YAxis stroke="#94a3b8" fontSize={isMobile ? 9 : 10} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: '600' }} />
                    <Area type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#gradOrders)" name="Orders" dot={false} animationDuration={1000} />
                    <Area type="monotone" dataKey="matches" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#gradMatches)" name="Matches" dot={false} animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal onReveal={() => setPieInView(true)}>
          <div className="card p-4 sm:p-6 flex flex-col h-full">
            <h3 className="text-base font-bold text-surface-900 mb-4 tracking-tight">Match Rate</h3>
            <div style={{ height: isMobile ? 180 : 220, width: '100%', position: 'relative' }}>
              {pieInView && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={isMobile ? 55 : 65} outerRadius={isMobile ? 75 : 85} paddingAngle={4} dataKey="value" strokeWidth={0} animationDuration={1000}>
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className={`${isMobile ? 'text-4xl' : 'text-5xl'} font-black text-surface-900 tracking-tighter`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {Math.round(matchRate)}<span className="text-xl font-bold opacity-30 ml-0.5">%</span>
                  </p>
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.25em] mt-1">Hit Rate</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2 sm:px-0">
        <Reveal>
          <div className="card p-4 sm:p-6 h-full">
            <h3 className="text-base font-bold text-surface-900 mb-6 tracking-tight">Recent Evaluations</h3>
            <div className="space-y-3">
              {evalsLoading ? <Spinner size="md" /> : evalsData?.evaluations?.length > 0 ? (
                evalsData.evaluations.slice(0, 4).map((evalItem) => (
                  <div key={evalItem._id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50/50 hover:bg-surface-100/50 transition-colors cursor-pointer" onClick={() => navigate('/results')}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-surface-800 truncate">{evalItem.fileName}</p>
                      <p className="text-[10px] text-surface-400 mt-0.5">{evalItem.totalOrders?.toLocaleString()} records</p>
                    </div>
                    <span className="badge-pass text-[10px] ml-2 flex-shrink-0">
                      {((evalItem.totalMatches / evalItem.totalOrders) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-surface-400 text-sm">No recent data.</div>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal onReveal={() => setRuleInView(true)}>
          <div className="card p-4 sm:p-6 min-h-[300px] sm:min-h-[350px] h-full overflow-hidden">
            <div className="mb-8">
              <h3 className="text-base font-bold text-surface-900 tracking-tight">Rule Overview</h3>
              <p className="text-[11px] font-medium text-surface-400 mt-0.5">Complexity by condition count</p>
            </div>
            
            <div style={{ height: 260, width: '100%' }}>
              {ruleEffectivenessData.length > 0 && ruleInView ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={ruleEffectivenessData} 
                    layout="vertical" 
                    margin={{ left: isMobile ? -20 : 0, right: 20, top: 0, bottom: 0 }}
                    barGap={8}
                  >
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={isMobile ? 80 : 120} 
                      stroke="#64748b" 
                      fontSize={isMobile ? 9 : 11} 
                      fontWeight={600}
                      axisLine={false} 
                      tickLine={false}
                      tick={(props) => {
                        const { x, y, payload } = props;
                        const maxChars = isMobile ? 8 : 15;
                        const label = payload.value.length > maxChars ? payload.value.slice(0, maxChars) + '...' : payload.value;
                        return (
                          <text x={x} y={y} dy={4} textAnchor="end" fill="#64748b" fontSize={isMobile ? 9 : 11} fontWeight={600} style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {label}
                          </text>
                        );
                      }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: 'none', 
                        borderRadius: '12px', 
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}
                      formatter={(value) => [`${value} Conditions`, 'Complexity']}
                    />
                    <Bar 
                      dataKey="conditions" 
                      fill="url(#barGrad)" 
                      radius={[0, 6, 6, 0]} 
                      barSize={isMobile ? 14 : 20}
                      animationDuration={1000}
                      animationBegin={0}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-surface-400 text-sm">
                  {ruleInView ? "No active rules to display." : ""}
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>

    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor }) => {
  return (
    <div className="card p-4 sm:p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-surface-100 group h-full">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-[0.15em] mb-1">{title}</p>
          <p className="text-xl sm:text-3xl font-black text-surface-900 tracking-tight leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</p>
          <p className="text-[10px] font-medium text-surface-400 mt-1.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;