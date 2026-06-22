import { useNavigate } from "react-router-dom";
import "./UrlCard.css";

const UrlCard = ({ url, onDelete }) => {
    const navigate = useNavigate();

    const handleCopy = () => {
        navigator.clipboard.writeText(`http://localhost:5000/${url.short_code}`);
        alert("Copied to clipboard!");
    };

    return (
        <div className="url-card">
            <div className="url-card-left">
                <p className="url-short">
                    http://localhost:5000/
                    <span>{url.short_code}</span>
                </p>
                <p className="url-original">{url.original_url}</p>
                <p className="url-date">
                    Created {new Date(url.created_at).toLocaleDateString()}
                    {url.expires_at && ` · Expires ${new Date(url.expires_at).toLocaleDateString()}`}
                </p>
            </div>
            <div className="url-card-actions">
                <button onClick={handleCopy} className="btn btn-copy">
                    Copy
                </button>
                <button
                    onClick={() => navigate(`/analytics/${url.short_code}`)}
                    className="btn btn-analytics"
                >
                    Analytics
                </button>
                <button
                    onClick={() => onDelete(url.short_code)}
                    className="btn btn-delete"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default UrlCard;