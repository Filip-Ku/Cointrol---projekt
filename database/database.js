import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  {
    name: 'myDatabase.db',
    location: 'default',
  },
  () => {},
  error => {
    console.error('Error opening database: ', error);
  }
);

const createTables = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        target_amount REAL NOT NULL
      );`
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        goal_id INTEGER,
        FOREIGN KEY (goal_id) REFERENCES goals (id)
      );`
    );
  });
};

const saveGoal = (name, targetAmount, currentAmount = 0) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT OR REPLACE INTO goals (name, target_amount, current_amount)
        VALUES (?, ?, ?)`,
        [name, targetAmount, currentAmount],
        (tx, results) => {
          console.log('Goal saved to database');
          resolve(results);
        },
        (error) => {
          console.error('Error saving goal: ', error);
          reject(error);
        }
      );
    });
  });
};

const fetchRecentTransactions = (category) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM transactions WHERE category = ? ORDER BY date DESC LIMIT 3',
        [category],
        (tx, results) => {
          let transactions = [];
          for (let i = 0; i < results.rows.length; i++) {
            transactions.push(results.rows.item(i));
          }
          resolve(transactions);
        },
        (error) => {
          console.error(`Error fetching ${category} transactions:`, error);
          reject(error);
        }
      );
    });
  });
};

const fetchGoal = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM goals ORDER BY id DESC LIMIT 1;',
        [],
        (tx, results) => {
          if (results.rows.length > 0) {
            resolve(results.rows.item(0));
          } else {
            resolve(null);
          }
        },
        (error) => {
          console.error('Error fetching goal from database:', error);
          reject(error);
        }
      );
    });
  });
};

const deleteAllTransactions = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM transactions',
        [],
        (tx, results) => {
          console.log('All transactions deleted');
          resolve(results);
        },
        (error) => {
          console.error('Error deleting transactions: ', error);
          reject(error);
        }
      );
    });
  });
};

createTables();

export { saveGoal, fetchRecentTransactions, fetchGoal, deleteAllTransactions };
export default db;