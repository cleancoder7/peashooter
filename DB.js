const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

class DB {
    constructor(options = {}) {
        if (!options.name) {
            // eslint-disable-next-line no-param-reassign
            options.name = 'remotelogs.sqlite3';
        }
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        this.db = new Database(path.join(process.cwd(), 'data', options.name), options);
        this.db.pragma('journal_mode = WAL');

        this.createEntryTableStmt = this.db
            .prepare(`
      CREATE TABLE IF NOT EXISTS "entries" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "text" TEXT NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `).run();

        this.insertEntryStmt = this.db.prepare('INSERT INTO "entries" (text) VALUES (?)');
        this.removeEntryStmt = this.db.prepare('DELETE FROM "entries" WHERE id = ?');
        this.removeAllEntriesStmt = this.db.prepare('DELETE FROM "entries"');
        this.getAllEntrysStmt = this.db.prepare('SELECT * from "entries"');
        this.getEntryStmt = this.db.prepare('SELECT * from "entries" WHERE id = ?');
    }

    close() {
        return this.db.close();
    }

    insertEntry(text) {
        return this.insertEntryStmt.run(text);
    }

    removeEntry(entryId) {
        return this.removeEntryStmt.run(entryId);
    }

    clear() {
        return this.removeAllEntriesStmt.run();
    }

    getEntry(entryId) {
        return this.getEntryStmt.get(entryId);
    }

    getAllEntrys() {
        return this.getAllEntrysStmt.all();
    }

}

module.exports = DB;
