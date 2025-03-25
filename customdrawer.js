import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';

const quotes = [
  "A penny saved is a penny earned. – Benjamin Franklin",
  "Do not save what is left after spending, but spend what is left after saving. – Warren Buffett",
  "The best way to predict your future is to create it. – Abraham Lincoln",
  "Saving money is the best way to ensure your financial security. – Unknown",
  "The habit of saving is a key to success. – Unknown",
  "A budget is telling your money where to go instead of wondering where it went. – Dave Ramsey",
  "Save money, and money will save you. – Unknown",
  "Small daily savings can turn into large wealth over time. – Unknown",
  "It’s not how much you make, it’s how much you save that counts. – Unknown",
  "Don't save what is left after spending, but spend what is left after saving. – Warren Buffett"
];


const CustomDrawerContent = (props) => {
  const [randomQuote, setRandomQuote] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setRandomQuote(quotes[randomIndex]);
  }, []);

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerContent}>
        <View style={styles.quoteContainer}>
          <Image
            source={require('./assets/money_bag.png')}
            style={styles.drawerImage}
          />
          <Text style={styles.drawerText}>Cointrol</Text>
          <Text style={styles.quoteText}>{randomQuote}</Text>
        </View>
      </View>
      <DrawerItemList {...props} itemStyle={styles.drawerItem} />
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  quoteContainer: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#2C2C2C',
    width: '100%',
  },
  drawerImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  drawerText: {
    color: '#ecf0f1',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  quoteText: {
    color: '#bdc3c7',
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  drawerItem: {
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
  },
});

export default CustomDrawerContent;