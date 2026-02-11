import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import {
  HomeScreen,
  ScriptDetailScreen,
  UploadScreen,
  SuccessScreen,
  EditScriptScreen,
} from '../screens';
import { useTheme } from '../context';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 16,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="ScriptDetail"
          component={ScriptDetailScreen}
          options={{
            title: 'Script Details',
            headerBackTitle: 'Back',
          }}
        />

        <Stack.Screen
          name="Upload"
          component={UploadScreen}
          options={{
            title: 'Upload Script',
            headerBackTitle: 'Cancel',
          }}
        />

        <Stack.Screen
          name="Success"
          component={SuccessScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="EditScript"
          component={EditScriptScreen}
          options={{
            title: 'Edit Script',
            headerBackTitle: 'Cancel',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
