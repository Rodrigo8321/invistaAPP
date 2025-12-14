import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import AssetDetailsScreen from '../screens/main/AssetDetailsScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#0f172a' }
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen 
        name="AssetDetails" 
        component={AssetDetailsScreen}
        options={{
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};
