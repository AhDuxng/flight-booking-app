import { supabase } from "../config/supabase.js";

export const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: `Missing authorization token`});
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        return res.status(401).json({ error: `Invalid authorization token`});
    }

    req.user = data.user;
    next();
};