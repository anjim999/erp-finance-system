// src/controllers/companyRequestController.js
import pool from "../../db/pool.js";
import bcrypt from "bcryptjs";
import { sendCompanyApprovalEmail } from "../../utils/mailer.js";

// User submits company registration request
export async function submitCompanyRequest(req, res) {
    try {
        const { userId } = req.user;
        const {
            company_name, industry, description, email, phone,
            website, address, city, state, country, pincode, gstin
        } = req.body;

        if (!company_name || !industry || !email) {
            return res.status(400).json({
                success: false,
                error: "Company name, industry and email are required"
            });
        }

        // Check if user already has a pending request
        const existingRequest = await pool.query(
            `SELECT id FROM company_requests WHERE user_id = $1 AND status = 'pending'`,
            [userId]
        );

        if (existingRequest.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: "You already have a pending company registration request"
            });
        }

        // Create request
        const result = await pool.query(
            `INSERT INTO company_requests 
       (user_id, company_name, industry, description, email, phone, website, address, city, state, country, pincode, gstin, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
       RETURNING *`,
            [userId, company_name, industry, description, email, phone, website, address, city, state, country, pincode, gstin]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: "Your company registration request has been submitted. You will receive an email once approved."
        });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ success: false, error: "Failed to submit request" });
    }
}

// Get user's own company requests
export async function getMyCompanyRequests(req, res) {
    try {
        const { userId } = req.user;
        const result = await pool.query(
            `SELECT * FROM company_requests WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ success: false, error: "Failed" });
    }
}

// Admin: Get all company requests
export async function getAllCompanyRequests(req, res) {
    try {
        const { status } = req.query;
        let query = `SELECT cr.*, u.name as user_name, u.email as user_email 
                 FROM company_requests cr 
                 LEFT JOIN users u ON cr.user_id = u.id`;
        const params = [];
        if (status) {
            query += ` WHERE cr.status = $1`;
            params.push(status);
        }
        query += ` ORDER BY cr.created_at DESC`;

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ success: false, error: "Failed" });
    }
}

// Admin: Approve company request and create company
export async function approveCompanyRequest(req, res) {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;

        await client.query('BEGIN');

        // Get request details
        const requestResult = await client.query(
            `SELECT * FROM company_requests WHERE id = $1`,
            [id]
        );

        if (requestResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: "Request not found" });
        }

        const request = requestResult.rows[0];

        if (request.status !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: "Request already processed" });
        }

        // Generate slug for company
        const slug = request.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

        // Create company with details from request
        const companyResult = await client.query(
            `INSERT INTO companies 
       (name, slug, industry, description, email, phone, website, address, city, state, country, pincode, gstin, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, true)
       RETURNING *`,
            [request.company_name, slug, request.industry, request.description, request.email,
            request.phone, request.website, request.address, request.city, request.state,
            request.country, request.pincode, request.gstin]
        );

        const company = companyResult.rows[0];

        // Update user: change role to company_admin and link to company
        await client.query(
            `UPDATE users SET role = 'company_admin', company_id = $1 WHERE id = $2`,
            [company.id, request.user_id]
        );

        // Get user details for response
        const userResult = await client.query(
            `SELECT email, name FROM users WHERE id = $1`,
            [request.user_id]
        );
        const user = userResult.rows[0];

        // Update request status
        await client.query(
            `UPDATE company_requests SET status = 'approved', admin_notes = $1, company_id = $2, processed_at = NOW() WHERE id = $3`,
            [admin_notes, company.id, id]
        );

        await client.query('COMMIT');

        // Send approval email to user
        let emailSent = false;
        try {
            const emailResult = await sendCompanyApprovalEmail({
                to: user.email,
                name: user.name,
                companyName: company.name,
                approved: true
            });
            emailSent = emailResult.success;
            if (emailSent) {
                console.log(`✅ Company approval email sent to ${user.email} for ${company.name}`);
            }
        } catch (emailErr) {
            console.error("Failed to send company approval email:", emailErr);
        }

        res.json({
            success: true,
            message: emailSent
                ? "Company approved! Confirmation email sent to user."
                : "Company approved! User can now log in as company_admin.",
            data: {
                company,
                user: {
                    name: user.name,
                    email: user.email,
                    newRole: 'company_admin'
                },
                emailSent
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error:", err);
        res.status(500).json({ success: false, error: "Failed to approve" });
    } finally {
        client.release();
    }
}

// Admin: Reject company request
export async function rejectCompanyRequest(req, res) {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;

        // Get request and user details first
        const requestResult = await pool.query(
            `SELECT cr.*, u.email as user_email, u.name as user_name 
             FROM company_requests cr 
             LEFT JOIN users u ON cr.user_id = u.id
             WHERE cr.id = $1`,
            [id]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Request not found" });
        }

        const request = requestResult.rows[0];

        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, error: "Request already processed" });
        }

        // Update status
        await pool.query(
            `UPDATE company_requests SET status = 'rejected', admin_notes = $1, processed_at = NOW() WHERE id = $2`,
            [admin_notes, id]
        );

        // Send rejection email
        let emailSent = false;
        try {
            const emailResult = await sendCompanyApprovalEmail({
                to: request.user_email,
                name: request.user_name,
                companyName: request.company_name,
                approved: false,
                notes: admin_notes
            });
            emailSent = emailResult.success;
            if (emailSent) {
                console.log(`✅ Company rejection email sent to ${request.user_email}`);
            }
        } catch (emailErr) {
            console.error("Failed to send rejection email:", emailErr);
        }

        res.json({
            success: true,
            message: emailSent
                ? "Request rejected. Notification email sent to user."
                : "Request rejected",
            emailSent
        });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ success: false, error: "Failed" });
    }
}
