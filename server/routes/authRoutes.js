import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken, requireAuth } from '../auth.js';

const router = express.Router();

// Check if store needs initial admin setup
router.get('/setup-status', (req, res) => {
  try {
    const userCount = db.prepare('SELECT count(*) as cnt FROM users').get().cnt;
    return res.json({ needsSetup: userCount === 0 });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao verificar status de inicialização.' });
  }
});

// Setup Master Admin when 0 users exist
router.post('/setup-admin', (req, res) => {
  try {
    const userCount = db.prepare('SELECT count(*) as cnt FROM users').get().cnt;
    if (userCount > 0) {
      return res.status(403).json({ error: 'A loja já possui um administrador configurado.' });
    }

    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 dígitos.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const cleanEmail = email.trim().toLowerCase();

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, role)
      VALUES (?, ?, ?, ?, 'admin')
    `).run(name.trim(), cleanEmail, passwordHash, phone ? phone.trim() : null);

    const userId = Number(insert.lastInsertRowid);
    const adminUser = { id: userId, name: name.trim(), email: cleanEmail, phone: phone || null, role: 'admin' };
    const token = signToken(adminUser);

    return res.status(201).json({
      message: 'Administrador Master criado com sucesso!',
      token,
      user: adminUser
    });
  } catch (err) {
    console.error('Setup admin error:', err);
    return res.status(500).json({ error: 'Erro ao configurar administrador master.' });
  }
});

// Register new customer
router.post('/register', (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado. Tente fazer login.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, role)
      VALUES (?, ?, ?, ?, 'customer')
    `).run(name.trim(), cleanEmail, passwordHash, phone ? phone.trim() : null);

    const userId = Number(insert.lastInsertRowid);
    const newUser = { id: userId, name: name.trim(), email: cleanEmail, phone: phone || null, role: 'customer' };
    const token = signToken(newUser);

    return res.status(201).json({
      message: 'Cadastro realizado com sucesso!',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Erro interno ao criar conta.' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    const token = signToken(safeUser);

    return res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erro ao autenticar.' });
  }
});

// Get current authenticated user
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

// Update profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'O nome não pode ficar em branco.' });
    }

    db.prepare(`
      UPDATE users SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name.trim(), phone ? phone.trim() : null, req.user.id);

    const updated = db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(req.user.id);
    return res.json({ message: 'Perfil atualizado com sucesso.', user: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

// Change password
router.put('/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Informe a senha atual e a nova senha.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'A senha atual informada está incorreta.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.user.id);

    return res.json({ message: 'Senha alterada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

// Customer Addresses
router.get('/addresses', requireAuth, (req, res) => {
  try {
    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(req.user.id);
    return res.json({ addresses });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar endereços.' });
  }
});

router.post('/addresses', requireAuth, (req, res) => {
  try {
    const { recipient_name, street, number, complement, neighborhood, city, state, zip_code, is_default } = req.body;

    if (!recipient_name || !street || !number || !neighborhood || !city || !state || !zip_code) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios do endereço.' });
    }

    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }

    const result = db.prepare(`
      INSERT INTO addresses (user_id, recipient_name, street, number, complement, neighborhood, city, state, zip_code, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, recipient_name, street, number, complement || null,
      neighborhood, city, state, zip_code, is_default ? 1 : 0
    );

    const newAddress = db.prepare('SELECT * FROM addresses WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json({ message: 'Endereço cadastrado com sucesso.', address: newAddress });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao salvar endereço.' });
  }
});

router.delete('/addresses/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    return res.json({ message: 'Endereço removido com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover endereço.' });
  }
});

// Forgot Password (Recovery token flow)
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Informe seu e-mail cadastrado.' });
    }

    const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email.trim().toLowerCase());
    // Always return success message for security (prevent email enumeration)
    return res.json({
      message: 'Se este e-mail estiver cadastrado, você receberá instruções com o link seguro para redefinição de senha.'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar solicitação.' });
  }
});

export default router;
