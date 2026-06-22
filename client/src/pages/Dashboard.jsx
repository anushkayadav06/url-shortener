import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import UrlCard from "../components/UrlCard";
import api from "../api/axios";
import "./Dashboard.css";

const Dashboard = () => {
    const [urls, setUrls] = useState([]);
    const [form, setForm] = useState({ originalUrl: "", customAlias: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchUrls(); }, []);

    const fetchUrls = async () => {
        try {
            const res = await api.get("/urls/my-urls");
            setUrls(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleShorten = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const res = await api.post("/urls/shorten", {
                originalUrl: form.originalUrl,
                customAlias: form.customAlias || undefined,
            });
            setSuccess(`✅ Short URL created: ${res.data.shortUrl}`);
            setForm({ originalUrl: "", customAlias: "" });
            fetchUrls();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to shorten URL");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (shortCode) => {
        try {
            await api.delete(`/urls/${shortCode}`);
            fetchUrls();
        } catch (err) {
            alert("Delete failed");
        }
    };

    return (
        <div className="dashboard-container">
            <Navbar />
            <div className="dashboard-main">
                <div className="dashboard-card">
                    <h3>Shorten a URL</h3>
                    {error && <p className="shorten-error">{error}</p>}
                    {success && <p className="shorten-success">{success}</p>}
                    <form onSubmit={handleShorten}>
                        <input className="shorten-input" type="text" placeholder="https://your-long-url.com" value={form.originalUrl} onChange={(e) => setForm({ ...form, originalUrl: e.target.value })} required />
                        <input className="shorten-input" type="text" placeholder="Custom alias (optional)" value={form.customAlias} onChange={(e) => setForm({ ...form, customAlias: e.target.value })} />
                        <button className="shorten-btn" disabled={loading}>
                            {loading ? "Shortening..." : "Shorten URL"}
                        </button>
                    </form>
                </div>

                <div className="dashboard-card">
                    <h3>Your URLs ({urls.length})</h3>
                    {urls.length === 0
                        ? <p className="urls-empty">No URLs yet. Create one above.</p>
                        : urls.map((url) => (
                            <UrlCard key={url.id} url={url} onDelete={handleDelete} />
                        ))
                    }
                </div>
            </div>
        </div>
    );
};

export default Dashboard;