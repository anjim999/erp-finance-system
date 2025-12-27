// src/controllers/employeeAccountController.js
import pool from "../../db/pool.js";
import bcrypt from "bcryptjs";
import { sendEmployeeWelcomeEmail } from "../../utils/mailer.js";

// HR creates employee with user account
export async function createEmployeeAccount(req, res) {
    const client = await pool.connect();
    try {
        const { companyId, userId } = req.user;
        const {
            name, email, password, role, department_id,
            employee_id, phone, designation, date_of_joining, salary,
            sendEmail = true // Option to skip email (default: send)
        } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: "Name, email and password are required" });
        }

        // Validate role
        const validRoles = ['hr_manager', 'finance_manager', 'inventory_manager', 'sales_manager', 'project_manager', 'employee'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ success: false, error: "Invalid role" });
        }

        await client.query('BEGIN');

        // Check if email already exists
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: "Email already registered" });
        }

        // Get company name for email
        const companyResult = await client.query(
            'SELECT name FROM companies WHERE id = $1',
            [companyId]
        );
        const companyName = companyResult.rows[0]?.name || 'Your Company';

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user account
        const userResult = await client.query(
            `INSERT INTO users (name, email, password, role, company_id, is_active, email_verified, created_by)
       VALUES ($1, $2, $3, $4, $5, true, true, $6)
       RETURNING id, name, email, role`,
            [name, email, hashedPassword, role || 'employee', companyId, userId]
        );

        const newUser = userResult.rows[0];

        // Create employee record
        const empResult = await client.query(
            `INSERT INTO employees (company_id, user_id, employee_id, name, email, phone, department_id, designation, date_of_joining, salary, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
            [companyId, newUser.id, employee_id || `EMP${Date.now()}`, name, email, phone, department_id, designation, date_of_joining, salary, userId]
        );

        await client.query('COMMIT');

        // Send welcome email with credentials (after successful commit)
        let emailSent = false;
        if (sendEmail) {
            try {
                const emailResult = await sendEmployeeWelcomeEmail({
                    to: email,
                    name: name,
                    companyName: companyName,
                    tempPassword: password
                });
                emailSent = emailResult.success;
                if (emailSent) {
                    console.log(`✅ Welcome email sent to ${email} for ${companyName}`);
                }
            } catch (emailErr) {
                console.error("Failed to send welcome email:", emailErr);
                // Don't fail the request - employee is created, email is a bonus
            }
        }

        res.status(201).json({
            success: true,
            data: {
                user: newUser,
                employee: empResult.rows[0],
                credentials: {
                    email,
                    password, // Return password so HR can also share it manually
                    loginUrl: '/login'
                },
                emailSent: emailSent
            },
            message: emailSent
                ? "Employee account created. Welcome email sent with credentials."
                : "Employee account created. Please share credentials with the employee manually."
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error creating employee account:", err);
        res.status(500).json({ success: false, error: "Failed to create employee account" });
    } finally {
        client.release();
    }
}

// Get all employees of a company
export async function getCompanyEmployees(req, res) {
    try {
        const { companyId } = req.user;

        const result = await pool.query(
            `SELECT e.*, d.name as department_name, u.role as user_role, u.is_active as user_active, u.last_login
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.company_id = $1
       ORDER BY e.created_at DESC`,
            [companyId]
        );

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ success: false, error: "Failed to fetch employees" });
    }
}

// Update employee and user role
export async function updateEmployeeRole(req, res) {
    const client = await pool.connect();
    try {
        const { companyId } = req.user;
        const { id } = req.params;
        const { role, is_active } = req.body;

        await client.query('BEGIN');

        // Get employee's user_id
        const empResult = await client.query(
            'SELECT user_id FROM employees WHERE id = $1 AND company_id = $2',
            [id, companyId]
        );

        if (empResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: "Employee not found" });
        }

        const userId = empResult.rows[0].user_id;

        // Update user role and status
        if (userId) {
            await client.query(
                'UPDATE users SET role = COALESCE($1, role), is_active = COALESCE($2, is_active) WHERE id = $3',
                [role, is_active, userId]
            );
        }

        // Update employee status
        await client.query(
            'UPDATE employees SET status = $1, updated_at = NOW() WHERE id = $2',
            [is_active ? 'active' : 'inactive', id]
        );

        await client.query('COMMIT');

        res.json({ success: true, message: "Employee updated" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error:", err);
        res.status(500).json({ success: false, error: "Failed to update" });
    } finally {
        client.release();
    }
}

// Reset employee password
export async function resetEmployeePassword(req, res) {
    try {
        const { companyId } = req.user;
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
        }

        // Get employee's user_id
        const empResult = await pool.query(
            'SELECT user_id, email FROM employees WHERE id = $1 AND company_id = $2',
            [id, companyId]
        );

        if (empResult.rows.length === 0 || !empResult.rows[0].user_id) {
            return res.status(404).json({ success: false, error: "Employee not found" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, empResult.rows[0].user_id]
        );

        res.json({
            success: true,
            credentials: {
                email: empResult.rows[0].email,
                password: newPassword
            },
            message: "Password reset. Share new credentials with employee."
        });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ success: false, error: "Failed to reset password" });
    }
}

// Deactivate employee
export async function deactivateEmployee(req, res) {
    const client = await pool.connect();
    try {
        const { companyId } = req.user;
        const { id } = req.params;

        await client.query('BEGIN');

        const empResult = await client.query(
            'SELECT user_id FROM employees WHERE id = $1 AND company_id = $2',
            [id, companyId]
        );

        if (empResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: "Employee not found" });
        }

        // Deactivate user account
        if (empResult.rows[0].user_id) {
            await client.query('UPDATE users SET is_active = false WHERE id = $1', [empResult.rows[0].user_id]);
        }

        // Update employee status
        await client.query(
            'UPDATE employees SET status = $1, updated_at = NOW() WHERE id = $2',
            ['inactive', id]
        );

        await client.query('COMMIT');
        res.json({ success: true, message: "Employee deactivated" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error:", err);
        res.status(500).json({ success: false, error: "Failed" });
    } finally {
        client.release();
    }
}
