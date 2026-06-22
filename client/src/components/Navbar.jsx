import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand" onClick={() => navigate("/dashboard")}>
                🔗 <span>Shortify</span>
            </div>
            <div className="navbar-right">
                <span className="navbar-email">{user?.email}</span>
                <button onClick={handleLogout} className="btn-logout">
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;