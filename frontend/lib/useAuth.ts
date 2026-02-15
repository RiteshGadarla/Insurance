import { useState, useEffect } from "react";

export function useAuth() {
    const [role, setRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setRole(localStorage.getItem("role"));
        setUserId(localStorage.getItem("user_id"));
        setName(localStorage.getItem("name"));
        setToken(localStorage.getItem("token"));
        setLoading(false);
    }, []);

    const logout = () => {
        localStorage.clear();
        setRole(null);
        setUserId(null);
        setName(null);
        setToken(null);
        window.location.href = "/login";
    };

    return { role, userId, name, token, loading, logout };
}
