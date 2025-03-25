import React, { useState,useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, useColorScheme, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import IncomeScreen from './layouts/income';
import OutcomeScreen from './layouts/outcome';
import CustomDrawerContent from './customdrawer';
import HomeScreen from './layouts/home';
import FinancialAnalysisScreen from './layouts/analysis';
import SplashScreen from './layouts/splashscreen';

const Drawer = createDrawerNavigator();

const myTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#1E1E1E',
    card: '#1E1E1E',
    text: '#F5F5F5',
    primary: '#F5F5F5',
  },
};

function MyDrawer() {
  const [refresh, setRefresh] = useState(false);

  const handleRefresh = () => {
    setRefresh(prev => !prev);
  };

   const handleGoalChange = () => {
      handleRefresh();
    };

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#1E1E1E',
          width: 300,
          paddingTop: 20,
        },
        drawerActiveBackgroundColor: '#2C2C2C',
        drawerActiveTintColor: '#F5F5F5',
        drawerInactiveTintColor: '#A9A9A9',
        drawerLabelStyle: {
          fontSize: 18,
          fontWeight: '700',
          color: '#F5F5F5',
          marginLeft: 10,
        },
        headerStyle: {
          backgroundColor: '#2C2C2C',
          elevation: 5,
        },
        headerTintColor: '#F5F5F5',
      }}
    >
       <Drawer.Screen name="Home">
              {() => <HomeScreen refresh={refresh} onRefresh={handleRefresh} onGoalChange={handleGoalChange} />}
            </Drawer.Screen>
            <Drawer.Screen name="Income">
              {() => <IncomeScreen refresh={refresh} onRefresh={handleRefresh} onGoalChange={handleGoalChange} />}
            </Drawer.Screen>
      <Drawer.Screen name="Outcome">
        {() => <OutcomeScreen refresh={refresh} onRefresh={handleRefresh} onGoalChange={handleGoalChange}/>}
      </Drawer.Screen>
      <Drawer.Screen name="Financial Analysis">
        {() => <FinancialAnalysisScreen refresh={refresh} onRefresh={handleRefresh} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContainer theme={myTheme}>
      <SafeAreaView style={[styles.container, backgroundStyle]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={{ flex: 1 }}>
          {isLoading ? <SplashScreen /> : <MyDrawer />}
        </View>
      </SafeAreaView>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

export default App;