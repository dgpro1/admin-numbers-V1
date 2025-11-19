import React, { useMemo } from 'react';
import { SalesNumber, Status } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, XAxis, YAxis, Bar, CartesianGrid } from 'recharts';

const CHART_COLORS = ['#4ADE80', '#60A5FA', '#A78BFA', '#FBBF24', '#F87171', '#2DD4BF', '#FB923C', '#F472B6', '#818CF8', '#9CA3AF', '#C084FC'];

interface DashboardProps {
  salesNumbers: SalesNumber[];
  statuses: Status[];
  selectedStatusFilter: string;
  setSelectedStatusFilter: (status: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ salesNumbers, statuses, selectedStatusFilter, setSelectedStatusFilter }) => {
    const statusChartData = useMemo(() => {
        const counts = salesNumbers.reduce((acc, number) => {
            acc[number.status] = (acc[number.status] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [salesNumbers]);

    const productChartData = useMemo(() => {
        let numbersToChart = salesNumbers;
        if (selectedStatusFilter) {
            numbersToChart = salesNumbers.filter(n => n.status === selectedStatusFilter);
        }
        const counts = numbersToChart.reduce((acc, number) => {
            acc[number.product] = (acc[number.product] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [salesNumbers, selectedStatusFilter]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 bg-gray-800 shadow-xl rounded-xl p-6 border border-gray-700">
                <h2 className="text-2xl font-semibold text-white mb-4">Números por Estado</h2>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="#8884d8" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                {statusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </section>
            <section className="lg:col-span-1 bg-gray-800 shadow-xl rounded-xl p-6 border border-gray-700">
                <h2 className="text-2xl font-semibold text-white mb-4">Números por Producto</h2>
                <select value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value)} className="w-full p-2 mb-4 bg-gray-700 text-white rounded-lg border border-gray-600">
                    <option value="">Todos los Estados</option>
                    {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productChartData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                            <XAxis type="number" stroke="#9CA3AF" />
                            <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={80} />
                            <Tooltip cursor={{ fill: '#374151' }} contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem' }} />
                            <Bar dataKey="value" fill="#818CF8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
