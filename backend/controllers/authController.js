
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import pool from '../config/db.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate Tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

export const register = async (req, res) => {
    // Validate Input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, first_name, last_name, company_name, phone_number } = req.body;

    try {
        const client = await pool.connect();

        // Check if user exists
        const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            client.release();
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create Organization (Simple implementation)
        let orgId = null;
        if (company_name) {
            const orgResult = await client.query(
                'INSERT INTO organizations (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
                [company_name]
            );
            orgId = orgResult.rows[0].id;
        }

        // Insert User
        const newUser = await client.query(
            'INSERT INTO users (email, password_hash, first_name, last_name, phone_number, organization_id, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id, email, role, phone_number, first_name, last_name',
            [email, hashedPassword, first_name, last_name, phone_number, orgId, 'admin']
        );

        const user = newUser.rows[0];
        const tokens = generateTokens(user);

        // Save Refresh Token
        await client.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
            [user.id, tokens.refreshToken]
        );

        client.release();
        res.json({ ...tokens, user });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const client = await pool.connect();
        
        const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            client.release();
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const user = result.rows[0];

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            client.release();
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const tokens = generateTokens(user);

        // Save Refresh Token
        await client.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
            [user.id, tokens.refreshToken]
        );

        client.release();
        res.json({ ...tokens, user: { id: user.id, email: user.email, role: user.role, phone_number: user.phone_number, first_name: user.first_name, last_name: user.last_name } });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        // Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, given_name, family_name, picture } = ticket.getPayload();

        const dbClient = await pool.connect();

        // Check if user exists
        let result = await dbClient.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = result.rows[0];
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            // User doesn't exist, create them
            // We set a random password for security since they use Google Login
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            // Optional: Create a default organization for them
            const orgName = `${given_name}'s Org`;
            const orgResult = await dbClient.query(
                'INSERT INTO organizations (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
                [orgName]
            );
            const orgId = orgResult.rows[0].id;

            const newUser = await dbClient.query(
                'INSERT INTO users (email, password_hash, first_name, last_name, organization_id, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id, email, role, phone_number, first_name, last_name',
                [email, hashedPassword, given_name, family_name || '', orgId, 'admin']
            );
            user = newUser.rows[0];
        }

        const tokens = generateTokens(user);

        // Save Refresh Token
        await dbClient.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
            [user.id, tokens.refreshToken]
        );

        dbClient.release();
        res.json({ 
            ...tokens, 
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role, 
                first_name: user.first_name, 
                last_name: user.last_name,
                phone_number: user.phone_number,
                picture 
            },
            isNewUser // Send flag to frontend to trigger profile completion
        });

    } catch (err) {
        console.error("Google Login Error:", err.message);
        res.status(500).json({ msg: 'Google Login Failed. Please check your client ID configuration.' });
    }
};

export const updateProfile = async (req, res) => {
    const { phone_number } = req.body;
    const userId = req.user.id;

    try {
        const client = await pool.connect();
        const result = await client.query(
            'UPDATE users SET phone_number = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, first_name, last_name, phone_number',
            [phone_number, userId]
        );
        
        if (result.rows.length === 0) {
            client.release();
            return res.status(404).json({ msg: 'User not found' });
        }
        
        client.release();
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const refreshToken = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.sendStatus(401);

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM refresh_tokens WHERE token = $1', [token]);
        
        if (result.rows.length === 0) {
            client.release();
            return res.sendStatus(403);
        }

        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            
            // Generate new access token
            const accessToken = jwt.sign(
                { id: user.id }, 
                process.env.JWT_SECRET, 
                { expiresIn: '15m' }
            );
            res.json({ accessToken });
        });
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const getMe = async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT id, email, first_name, last_name, role, organization_id, phone_number FROM users WHERE id = $1', [req.user.id]);
        client.release();
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
