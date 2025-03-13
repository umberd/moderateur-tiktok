const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Create database connection
const dbPath = path.join(dataDir, 'tiktok_chat.db');
const db = new sqlite3.Database(dbPath);

// Initialize database with required tables
function initDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tiktok_id TEXT UNIQUE NOT NULL,
                nickname TEXT NOT NULL,
                first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            // Create friends list
            db.run(`CREATE TABLE IF NOT EXISTS friends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);

            // Create undesirables list
            db.run(`CREATE TABLE IF NOT EXISTS undesirables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                reason TEXT,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);

            // Create indexes
            db.run(`CREATE INDEX IF NOT EXISTS idx_users_tiktok_id ON users (tiktok_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends (user_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_undesirables_user_id ON undesirables (user_id)`);
        }, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Get or create user
async function getOrCreateUser(tiktokId, nickname) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE tiktok_id = ?', [tiktokId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (row) {
                // Update last_seen timestamp
                db.run('UPDATE users SET last_seen = CURRENT_TIMESTAMP, nickname = ? WHERE id = ?', [nickname, row.id]);
                resolve(row);
            } else {
                // Insert new user
                db.run('INSERT INTO users (tiktok_id, nickname) VALUES (?, ?)', [tiktokId, nickname], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // Return the new user
                    db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(newUser);
                    });
                });
            }
        });
    });
}

// Add user to friends list
async function addToFriends(tiktokId, nickname) {
    try {
        const user = await getOrCreateUser(tiktokId, nickname);
        
        return new Promise((resolve, reject) => {
            // Check if already in friends list
            db.get('SELECT * FROM friends WHERE user_id = ?', [user.id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (row) {
                    // Already a friend
                    resolve(false);
                } else {
                    // First remove from undesirables if present
                    db.run('DELETE FROM undesirables WHERE user_id = ?', [user.id]);
                    
                    // Add to friends
                    db.run('INSERT INTO friends (user_id) VALUES (?)', [user.id], function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(true);
                    });
                }
            });
        });
    } catch (error) {
        throw error;
    }
}

// Add user to undesirables list
async function addToUndesirables(tiktokId, nickname, reason = '') {
    try {
        const user = await getOrCreateUser(tiktokId, nickname);
        
        return new Promise((resolve, reject) => {
            // Check if already in undesirables list
            db.get('SELECT * FROM undesirables WHERE user_id = ?', [user.id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (row) {
                    // Already in undesirables
                    resolve(false);
                } else {
                    // First remove from friends if present
                    db.run('DELETE FROM friends WHERE user_id = ?', [user.id]);
                    
                    // Add to undesirables
                    db.run('INSERT INTO undesirables (user_id, reason) VALUES (?, ?)', [user.id, reason], function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(true);
                    });
                }
            });
        });
    } catch (error) {
        throw error;
    }
}

// Remove user from friends list
async function removeFromFriends(tiktokId) {
    try {
        return new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE tiktok_id = ?', [tiktokId], (err, user) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!user) {
                    resolve(false);
                    return;
                }
                
                db.run('DELETE FROM friends WHERE user_id = ?', [user.id], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(this.changes > 0);
                });
            });
        });
    } catch (error) {
        throw error;
    }
}

// Remove user from undesirables list
async function removeFromUndesirables(tiktokId) {
    try {
        return new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE tiktok_id = ?', [tiktokId], (err, user) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!user) {
                    resolve(false);
                    return;
                }
                
                db.run('DELETE FROM undesirables WHERE user_id = ?', [user.id], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(this.changes > 0);
                });
            });
        });
    } catch (error) {
        throw error;
    }
}

// Check if user is in friends list
async function isUserFriend(tiktokId) {
    try {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT f.id FROM friends f
                JOIN users u ON f.user_id = u.id
                WHERE u.tiktok_id = ?
            `, [tiktokId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(!!row);
            });
        });
    } catch (error) {
        throw error;
    }
}

// Check if user is in undesirables list
async function isUserUndesirable(tiktokId) {
    try {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT u.id, ud.reason FROM undesirables ud
                JOIN users u ON ud.user_id = u.id
                WHERE u.tiktok_id = ?
            `, [tiktokId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row ? { isUndesirable: true, reason: row.reason } : { isUndesirable: false });
            });
        });
    } catch (error) {
        throw error;
    }
}

// Get all friends
async function getAllFriends() {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT u.id, u.tiktok_id, u.nickname, u.first_seen, u.last_seen, f.added_at
            FROM friends f
            JOIN users u ON f.user_id = u.id
            ORDER BY f.added_at DESC
        `, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
}

// Get all undesirables
async function getAllUndesirables() {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT u.id, u.tiktok_id, u.nickname, u.first_seen, u.last_seen, ud.reason, ud.added_at
            FROM undesirables ud
            JOIN users u ON ud.user_id = u.id
            ORDER BY ud.added_at DESC
        `, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
}

// Search for users
async function searchUsers(query) {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT u.id, u.tiktok_id, u.nickname, u.first_seen, u.last_seen,
                CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as is_friend,
                CASE WHEN ud.id IS NOT NULL THEN 1 ELSE 0 END as is_undesirable,
                ud.reason
            FROM users u
            LEFT JOIN friends f ON u.id = f.user_id
            LEFT JOIN undesirables ud ON u.id = ud.user_id
            WHERE u.tiktok_id LIKE ? OR u.nickname LIKE ?
            ORDER BY u.last_seen DESC
            LIMIT 50
        `, [`%${query}%`, `%${query}%`], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
}

module.exports = {
    initDatabase,
    getOrCreateUser,
    addToFriends,
    addToUndesirables,
    removeFromFriends,
    removeFromUndesirables,
    isUserFriend,
    isUserUndesirable,
    getAllFriends,
    getAllUndesirables,
    searchUsers
}; 