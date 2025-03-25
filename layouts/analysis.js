import React from 'react';
import { View, Text, StyleSheet, Dimensions, Switch, ScrollView } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import db from '../database/database';

export default class FinancialAnalysisScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      incomeData: [0, 0, 0, 0],
      expenseData: [0, 0, 0, 0],
      incomeCount: 0,
      expenseCount: 0,
      showIncome: true,
    };
  }

  componentDidMount() {
    this.fetchFinancialData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.refresh !== this.props.refresh) {
      this.fetchFinancialData();
    }
  }

  calculateStatistics = () => {
    const totalIncome = this.state.incomeData.reduce((acc, val) => acc + val, 0);
    const totalExpenses = this.state.expenseData.reduce((acc, val) => acc + val, 0);
    const averageIncome = this.state.incomeCount ? totalIncome / this.state.incomeCount : 0;
    const averageExpenses = this.state.expenseCount ? totalExpenses / this.state.expenseCount : 0;
    const totalSavings = totalIncome - totalExpenses;
    const averageSavings = this.state.incomeCount ? (totalIncome - totalExpenses) / this.state.incomeCount : 0;

    return { totalIncome, totalExpenses, averageIncome, averageExpenses, totalSavings, averageSavings };
  }


  fetchFinancialData = async () => {
    try {
      const currentDate = new Date();
      const last4Months = [];
      for (let i = 0; i < 4; i++) {
        const month = new Date(currentDate);
        month.setMonth(currentDate.getMonth() - i);
        last4Months.push(month.toISOString().split('T')[0]);
      }

      db.transaction(tx => {
        last4Months.forEach((month, index) => {
          const monthYear = month.substring(0, 7);

          tx.executeSql(
            'SELECT SUM(amount) as totalIncome FROM transactions WHERE category = ? AND strftime("%Y-%m", date) = ?',
            ['income', monthYear],
            (tx, results) => {
              if (results.rows.length > 0) {
                this.setState(prevState => {
                  const newIncomeData = [...prevState.incomeData];
                  newIncomeData[3 - index] = results.rows.item(0).totalIncome || 0;
                  return { incomeData: newIncomeData };
                });
              }
            }
          );

          tx.executeSql(
            'SELECT SUM(amount) as totalExpenses FROM transactions WHERE category = ? AND strftime("%Y-%m", date) = ?',
            ['outcome', monthYear],
            (tx, results) => {
              if (results.rows.length > 0) {
                this.setState(prevState => {
                  const newExpenseData = [...prevState.expenseData];
                  newExpenseData[3 - index] = results.rows.item(0).totalExpenses || 0;
                  return { expenseData: newExpenseData };
                });
              }
            }
          );
        });

        tx.executeSql(
          'SELECT COUNT(*) as transactionCount FROM transactions WHERE category=?',
          ['outcome'],
          (tx, results) => {
            if (results.rows.length > 0) {
              this.setState({ expenseCount: results.rows.item(0).transactionCount });
            }
          }
        );

        tx.executeSql(
          'SELECT COUNT(*) as transactionCount FROM transactions WHERE category=?',
          ['income'],
          (tx, results) => {
            if (results.rows.length > 0) {
              this.setState({ incomeCount: results.rows.item(0).transactionCount });
            }
          }
        );
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  toggleChart = () => {
    this.setState(prevState => ({ showIncome: !prevState.showIncome }));
  };

  getSavingsRateRanking = (savingsRate) => {
    if (savingsRate >= 20) return 'Excellent';
    if (savingsRate >= 10) return 'Good';
    return 'Needs Improvement';
  };


  render() {
    const { incomeData, expenseData, showIncome, incomeCount, expenseCount } = this.state;
    const data = showIncome ? incomeData : expenseData;
    const incomeMinusExpense = incomeData.map((income, index) => income - expenseData[index]);

    const chartData = {
      labels: ['3 Months Ago', '2 Months Ago', 'Last Month', 'This Month'],
      datasets: [
        {
          data: data,
          strokeWidth: 2,
        },
      ],
    };

    const lineChartData = {
      labels: ['3 Months Ago', '2 Months Ago', 'Last Month', 'This Month'],
      datasets: [
        {
          data: incomeMinusExpense,
          strokeWidth: 3,
          withDots: true,
          withShadow: false,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          fillColor: 'rgba(255, 255, 255, 0.2)',
        },
      ],
    };

    const { totalIncome, totalExpenses, averageIncome, averageExpenses, totalSavings } = this.calculateStatistics();
    const savingsRate = totalIncome ? ((totalSavings / totalIncome) * 100).toFixed(2) : 0;
    const savingsRateRanking = this.getSavingsRateRanking(savingsRate);

    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.titleSwitchContainer}>
          <Text style={styles.chartTitle}>Income vs Outcome Chart</Text>
          <Switch
            value={showIncome}
            onValueChange={this.toggleChart}
            thumbColor={'#f4f3f4'}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
          />
        </View>

        <View style={styles.chartContainer}>
          <BarChart
            data={chartData}
            width={Dimensions.get('window').width - 10}
            height={250}
            chartConfig={{
              backgroundColor: '#1E1E1E',
              decimalPlaces: 2,
              fromZero: true,
              yAxisMin: 0,
                  yAxisMax: 10000  ,
              withInnerLines: true,
              horizontalLabelRotation: 0,
              verticalLabelRotation: 0,
              showBarTops: true,
              showValuesOnTopOfBars: true,
              color: (opacity = 1) => showIncome
                ? `rgba(0, 255, 0, ${opacity})`
                : `rgba(255, 0, 0, ${opacity})`,
              paddingTop: 20,
              paddingRight: 20,
              yAxisLabelStyle: { fontSize: 10 },
              formatXLabel: (value, index) => {
                if (index === 0) {
                  return '3 Months\nAgo';
                }
                return value;
              },
            }}
            spacing={0}
          />
        </View>

        <Text style={styles.chartTitle}>Cumulative Income vs Outcome</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={lineChartData}
            width={Dimensions.get('window').width - 10}
            height={250}
            chartConfig={{
              backgroundColor: '#1E1E1E',
              decimalPlaces: 2,
              fromZero: true,
              yAxisMin: 0,
              withInnerLines: true,
              horizontalLabelRotation: 0,
              verticalLabelRotation: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              fillColor: 'rgba(255, 255, 255, 0.2)',
              yAxisLabelStyle: { fontSize: 10 },
              paddingTop: 20,
              paddingRight: 20,
            }}
            bezier
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={[styles.statText, styles.incomeText]}>Total Income: {totalIncome.toFixed(2)} PLN</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statText, styles.expenseText]}>Total Expenses: {totalExpenses.toFixed(2)} PLN</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statText, styles.incomeText]}>Average Income: {averageIncome.toFixed(2)} PLN</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statText, styles.expenseText]}>Average Expenses: {averageExpenses.toFixed(2)} PLN</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statText, styles.incomeText]}>Total Savings: {totalSavings.toFixed(2)} PLN</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statText, styles.expenseText]}>Total Outcomes: {totalExpenses.toFixed(2)} PLN</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statText, styles.incomeText]}>Savings Rate: {savingsRate}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statText, styles.expenseText]}>Expense Ratio: {totalIncome ? ((totalExpenses / totalIncome) * 100).toFixed(2) : 0}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statText, styles.incomeText]}>Incomes Count: {this.state.incomeCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statText, styles.expenseText]}>Outcomes Count: {this.state.expenseCount}</Text>
          </View>
        </View>
        <Text style={[styles.statText, styles.incomeText, { margin: 10, textAlign: 'center' }]}>
          Savings Ranking: {savingsRateRanking}
        </Text>

      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  scrollContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    width: '90%',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    marginTop: 10,
    marginRight: 10,
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#333333',
    width: '90%',
    borderRadius: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: '#444444',
    borderRadius: 8,
    padding: 15,
    margin: 5,
    width: '46%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  incomeText: {
    color: '#00FF00',
  },
  expenseText: {
    color: '#FF0000',
  },
});