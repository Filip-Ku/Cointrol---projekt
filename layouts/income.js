import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TextInput, TouchableOpacity } from 'react-native';
import db from '../database/database';
import { fetchGoal } from '../database/database'; // Import the fetchGoal function

export default function IncomeScreen({ refresh, onRefresh, onGoalChange }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [incomeTransactions, setIncomeTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [goalId, setGoalId] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');

  const fetchIncomeTransactions = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM transactions WHERE category = ? ORDER BY date DESC',
        ['income'],
        (tx, results) => {
          let transactions = [];
          for (let i = 0; i < results.rows.length; i++) {
            transactions.push(results.rows.item(i));
          }
          const filteredTransactions = filterTransactions(transactions);
          setIncomeTransactions(filteredTransactions);
        },
        (error) => {
          console.error('Error fetching transactions:', error);
        }
      );
    });
  };

  useEffect(() => {
    fetchIncomeTransactions();
    fetchLatestGoal();
  }, []);

  useEffect(() => {
    fetchIncomeTransactions();
  }, [refresh]);

  useEffect(() => {
    fetchLatestGoal();
  }, [onGoalChange]);

  useEffect(() => {
    fetchIncomeTransactions();
  }, [dateFilter, refresh]);

  const fetchLatestGoal = async () => {
    try {
      const goal = await fetchGoal();
      if (goal) {
        setGoalId(goal.id);
      }
    } catch (error) {
      console.error('Error fetching latest goal:', error);
    }
  };

  const filteredTransactions = incomeTransactions.filter(transaction => {
    if (!searchQuery) return true;
    const regex = new RegExp(searchQuery.split('*').join('.*'), 'i'); // Convert '*' to regex '.*'
    return regex.test(transaction.title);
  });

  const filterTransactions = (transactions) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);

      switch (dateFilter) {
        case 'lastMonth':
          return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth;
        case 'thisMonth':
          return transactionDate >= startOfMonth;
        case 'all':
        default:
          return true;
      }
    });
  };

  const handleSubmit = () => {
    const date = new Date().toISOString();
    if (title && amount && goalId) {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO transactions (date, title, amount, category, goal_id) VALUES (?, ?, ?, ?, ?)',
          [date, title, parseFloat(amount), "income", goalId], // Include goalId in the insert
          (tx, results) => {
            if (results.rowsAffected > 0) {
              console.log('Transaction added successfully');
              onRefresh();
            } else {
              console.log('Error adding transaction');
            }
          },
          (error) => {
            console.error('Error executing SQL:', error);
          }
        );
      });
      fetchIncomeTransactions();
      setTitle('');
      setAmount('');
    } else {
      alert('Please fill in all fields!');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.lastTransactions}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name"
            placeholderTextColor="#000"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Image
            source={require('../assets/lupa.png')}
            style={styles.searchIcon}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, dateFilter === 'lastMonth' && styles.activeButton]}
            onPress={() => setDateFilter('lastMonth')}
          >
            <Text style={styles.buttonText}>Last Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, dateFilter === 'thisMonth' && styles.activeButton]}
            onPress={() => setDateFilter('thisMonth')}
          >
            <Text style={styles.buttonText}>This Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, dateFilter === 'all' && styles.activeButton]}
            onPress={() => setDateFilter('all')}
          >
            <Text style={styles.buttonText}>All Time</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredTransactions}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <Text style={styles.transactionTitle}>{item.title}</Text>
              <Text style={styles.transactionAmount}>{item.amount.toFixed(2)} PLN</Text>
              <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.flatListContainer}
        />
      </View>

      <View style={styles.addTransaction}>
        <Text style={styles.addTransactionTitle}>Add Income</Text>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  lastTransactions: {
    backgroundColor: '#333',
    padding: 15,
    width: '85%',
    marginTop: 20,
    height: 440,
    borderRadius: 10,
    elevation: 5,
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#228B22',
  },
  searchContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingLeft: 10,
    fontSize: 16,
  },
  searchIcon: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#999',
  },
  allTimeButton: {
    backgroundColor: '#f1f1f1',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  addTransaction: {
    backgroundColor: '#333',
    padding: 15,
    width: '85%',
    marginTop: 20,
    height: 200,
    borderRadius: 10,
    elevation: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#228B22',
    justifyContent: 'center',
  },
  addTransactionTitle: {
    color: '#50C878',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 35,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 10,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#50C878',
    width: '100%',
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  flatListContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  transactionItem: {
    backgroundColor: '#000',
    padding: 6,
    marginBottom: 10,
    borderRadius: 5,
    width: 300,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#228B22',
    display: 'flex',
    flexDirection: 'row',
  },
  transactionTitle: {
    color: '#50C878',
    fontSize: 18,
    marginRight: 'auto',
    fontWeight: 'bold',
  },
  transactionAmount: {
    color: '#50C878',
    fontSize: 16,
    marginRight: 'auto',
    marginTop: 5,
  },
  transactionDate: {
    color: '#50C878',
    fontSize: 14,
    marginTop: 5,
  },
});