import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import "./Analytics.css";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

const Analytics = () => {
    const { shortCode } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/analytics/${shortCode}`);
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [shortCode]);

    if (loading) return <div className="analytics-loading">Loading analytics...</div>;
    if (!data) return <div className="analytics-loading">No data found</div>;

    return (
        <div className="analytics-container">
            <Navbar />
            <div className="analytics-main">
                <button onClick={() => navigate("/dashboard")} className="analytics-back">
                    ← Back to Dashboard
                </button>

                <div className="analytics-card">
                    <p className="analytics-url">{data.url.originalUrl}</p>
                    <h1 className="analytics-total">{data.analytics.totalClicks}</h1>
                    <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>total clicks</p>
                </div>

                <div className="analytics-card">
                    <h3>Clicks — last 7 days</h3>
                    {data.analytics.clicksLast7Days.length === 0
                        ? <p className="analytics-empty">No clicks yet</p>
                        : <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={data.analytics.clicksLast7Days}>
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    }
                </div>

                <div className="analytics-card">
                    <h3>Device breakdown</h3>
                    {data.analytics.byDevice.length === 0
                        ? <p className="analytics-empty">No data yet</p>
                        : <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={data.analytics.byDevice} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={80} label>
                                    {data.analytics.byDevice.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    }
                </div>

                <div className="analytics-card">
                    <h3>Top referrers</h3>
                    {data.analytics.topReferrers.length === 0
                        ? <p className="analytics-empty">No referrer data yet</p>
                        : data.analytics.topReferrers.map((r, i) => (
                            <div key={i} className="referrer-row">
                                <span>{r.referrer}</span>
                                <span>{r.count} clicks</span>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
};

export default Analytics;