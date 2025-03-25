import React, { useState, useEffect } from 'react';
import { SafeAreaView, FlatList, StyleSheet, Text, TouchableOpacity, Image, Modal, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveGoal, fetchRecentTransactions, fetchGoal, deleteAllTransactions } from '../database/database';
import db from '../database/database';

function HomeScreen({ refresh, onRefresh,onGoalChange  }) {
  const [goalAmount, setGoalAmount] = useState(0);
  const [goalName, setGoalName] = useState('Nazwa celu');
  const [currency, setCurrency] = useState('PLN');
  const [amount, setAmount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [newGoalAmount, setNewGoalAmount] = useState(goalAmount);
  const [newGoalName, setNewGoalName] = useState(goalName);
  const [recentIncomeTransactions, setRecentIncomeTransactions] = useState([]);
  const [recentOutcomeTransactions, setRecentOutcomeTransactions] = useState([]);
  const [goalId, setGoalId] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({ PLN: 1 });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);


  const clampedAmount = Math.max(0, Math.min(amount, goalAmount));
  const progress = goalAmount > 0 ? (clampedAmount / goalAmount) * 100 : 0;

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedAmount = await AsyncStorage.getItem('amount');
        if (storedAmount) setAmount(parseFloat(storedAmount));
      } catch (error) {
        console.error('Error loading data from AsyncStorage', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        if (isNaN(amount)) {
          setAmount(0);
        }
        await AsyncStorage.setItem('goalAmount', goalAmount.toString());
        await AsyncStorage.setItem('goalName', goalName);
        await AsyncStorage.setItem('amount', amount.toString());
        await AsyncStorage.setItem('currency', currency);
      } catch (error) {
        console.error('Error saving data to AsyncStorage', error);
      }
    };

    saveData();
  }, [goalAmount, goalName, amount, currency]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const incomeTransactions = await fetchRecentTransactions('income');
        const outcomeTransactions = await fetchRecentTransactions('outcome');
        setRecentIncomeTransactions(incomeTransactions);
        setRecentOutcomeTransactions(outcomeTransactions);
        calculateProgress();
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    const fetchGoalData = async () => {
      try {
        const goal = await fetchGoal();
        if (goal) {
          setGoalName(goal.name);
          setGoalAmount(goal.target_amount);
          setNewGoalName(goal.name);
          setNewGoalAmount(goal.target_amount);
          setGoalId(goal.id);
          calculateProgress(goal.id);
        }
      } catch (error) {
        console.error('Error fetching goal from database:', error);
      }
    };

    const fetchCurrencies = async () => {
      try {
        const response = await fetch('https://api.nbp.pl/api/exchangerates/tables/A?format=json');
        const data = await response.json();
        const currencyList = data[0].rates.map(rate => ({
          code: rate.code,
          currency: rate.currency,
        }));
        setCurrencies(currencyList);
        const rates = {};
        data[0].rates.forEach(rate => {
          rates[rate.code] = rate.mid;
        });
        setExchangeRates(rates);
      } catch (error) {
        console.error('Error fetching currencies:', error);
      }
    };

    fetchTransactions();
    fetchGoalData();
    fetchCurrencies();
  }, [refresh]);

  const handleSaveGoal = async () => {
    const parsedGoalAmount = parseFloat(newGoalAmount) || 0;
    setGoalAmount(parsedGoalAmount);
    setGoalName(newGoalName);

    try {
      await saveGoal(newGoalName, parsedGoalAmount);
      setModalVisible(false);
      const goal = await fetchGoal();
      if (goal) {
        setGoalId(goal.id);
        calculateProgress(goal.id);
        onGoalChange();
      }
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const calculateProgress = async (goalId) => {
    if (!goalId) return;

    try {
      const totalIncome = await new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT SUM(amount) as total FROM transactions WHERE category = ? AND goal_id = ?',
            ['income', goalId],
            (tx, results) => {
              resolve(results.rows.item(0).total || 0);
            },
            (error) => {
              console.error('Error fetching total income:', error);
              reject(error);
            }
          );
        });
      });

      const totalOutcome = await new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT SUM(amount) as total FROM transactions WHERE category = ? AND goal_id = ?',
            ['outcome', goalId],
            (tx, results) => {
              resolve(results.rows.item(0).total || 0);
            },
            (error) => {
              console.error('Error fetching total outcome:', error);
              reject(error);
            }
          );
        });
      });

      const netAmount = totalIncome - totalOutcome;

      setAmount(netAmount);
    } catch (error) {
      console.error('Error calculating progress:', error);
    }
  };

  const handleDeleteAllData = async () => {
     try {
       await deleteAllTransactions();
       setRecentIncomeTransactions([]);
       setRecentOutcomeTransactions([]);
       onRefresh();
       setAmount(0);
       setDeleteModalVisible(false);
     } catch (error) {
       console.error('Error deleting all data:', error);
     }
   };

   const cancelDelete = () => {
       setDeleteModalVisible(false);
     };

 const convertGoalAmount = () => {
   if (goalAmount <= 0) return '0.00';
   const rate = exchangeRates[currency];
   if (rate) {
     return (goalAmount /rate).toFixed(2);
   }
   return goalAmount.toFixed(2);
 };

 const convertActualAmount = () => {
   if (amount <= 0) return '0.00';
   const rate = exchangeRates[currency];
   if (rate) {
     return (amount / rate).toFixed(2);
   }
   return amount.toFixed(2);
 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scrollContainer}>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image source={require('../assets/money_bag.png')} style={styles.image} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setCurrencyModalVisible(true)}>
          <Image source={require('../assets/exchange.png')} style={styles.exchangeImage} />
        </TouchableOpacity>

        <TouchableOpacity  onPress={() => setDeleteModalVisible(true)}>
          <Image source={require('../assets/delete.png')} style={styles.deleteImage} />
        </TouchableOpacity>

        <Text style={styles.progressText}>{goalName}</Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.progressText}>
          {amount}/{goalAmount} PLN ({progress.toFixed(2)} %)
        </Text>

        <Text style={styles.convertedAmountText}>
          {convertActualAmount()}/{convertGoalAmount()} {currency}
        </Text>

        <View style={styles.containerColumn}>
          <View style={[styles.box, { borderWidth: 2, borderColor: 'lightgreen' }]}>
            <Text style={[styles.textInBox, { color: 'lightgreen' }]}>LAST INCOMES:</Text>
            <FlatList
              data={recentIncomeTransactions}
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
          <View style={[styles.box, { borderWidth: 2, borderColor: 'red' }]}>
            <Text style={[styles.textInBox, { color: 'red' }]}>LAST EXPENSES:</Text>
            <FlatList
              data={recentOutcomeTransactions}
              renderItem={({ item }) => (
                <View style={[styles.transactionItem, { borderColor: 'red' }]}>
                  <Text style={[styles.transactionTitle, { color: 'red' }]}>{item.title}</Text>
                  <Text style={[styles.transactionAmount, { color: 'red' }]}>{item.amount.toFixed(2)} PLN</Text>
                  <Text style={[styles.transactionDate, { color: 'red' }]}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.flatListContainer}
            />
          </View>
        </View>

        <Modal visible={deleteModalVisible} transparent animationType="slide">
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalContent}>
              <Text style={styles.deleteModalText}>Are you sure you want to delete all data?</Text>

              <TouchableOpacity onPress={handleDeleteAllData} style={styles.modalButton}>
                <Text style={styles.buttonText}>YES</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={cancelDelete} style={[styles.modalButton, styles.cancelButton]}>
                <Text style={[styles.buttonText, styles.cancelButtonText]}>NO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { height: 'auto' }]}>
              <Text style={styles.modalText}>Ustaw nowy cel:</Text>
              <TextInput
                style={styles.input}
                keyboardType="default"
                value={newGoalName}
                onChangeText={setNewGoalName}
              />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={newGoalAmount.toString()}
                onChangeText={(text) => setNewGoalAmount(parseFloat(text) || 0)}
              />
              <TouchableOpacity onPress={handleSaveGoal} style={styles.modalButton}>
                <Text style={styles.buttonText}>Zapisz</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, styles.cancelButton]}>
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={currencyModalVisible} transparent animationType="slide">
          <View style={[styles.modalContainer]}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Select Currency:</Text>
              <FlatList
                data={currencies}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => {
                    setCurrency(item.code);
                    setCurrencyModalVisible(false);
                  }}>
                    <Text style={styles.currencyItem}>{item.code} - {item.currency}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.code}
              />
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)} style={[styles.modalButton, styles.cancelButton]}>
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginTop: 40,
  },
  exchangeImage: {
    width: 50,
    height: 50,
    position: 'absolute',
    top: -158,
    right: -160,
  },
  deleteImage: {
    width: 40,
    height: 50,
    position: 'absolute',
    top: -160,
    left: -160,
  },
  progressText: {
    fontSize: 18,
    color: '#fff',
    marginVertical: 10,
  },
  convertedAmountText: {
    fontSize: 14,
    color: 'grey',
    margin: -3
  },
  progressBar: {
    width: 240,
    height: 30,
    backgroundColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'green',
  },
  containerColumn: {
    flexDirection: 'column',
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  box: {
    width: '80%',
    height: 170,
    backgroundColor: '#444',
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  textInBox: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    height:  '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  modalButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    margin: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'red',
  },
  cancelButtonText: {
    color: '#fff',
  },
  flatListContainer: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  transactionItem: {
    backgroundColor: '#000',
    padding: 4,
    marginBottom: 8,
    borderRadius: 5,
    width: 280,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'lightgreen',
    display: 'flex',
    flexDirection: 'row',
  },
  transactionTitle: {
    color: 'lightgreen',
    fontSize: 16,
    marginRight: 'auto',
    fontWeight: 'bold',
  },
  transactionAmount: {
    color: 'lightgreen',
    fontSize: 14,
    marginRight: 'auto',
    marginTop: 3,
  },
  transactionDate: {
    color: 'lightgreen',
    fontSize: 12,
    marginTop: 3,
  },
  currencyItem: {
    padding: 10,
    fontSize: 16,
    color: '#000',
  },
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
  },
  deleteModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    borderColor: 'red',
    borderWidth: 2,
  },
  deleteModalText: {
    fontSize: 20,
    color: 'red',
    marginBottom: 10,
  },
});

export default HomeScreen;