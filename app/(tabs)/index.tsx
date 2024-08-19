import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter, Href } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  const navigateTo = (route: Href<string>) => {
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fitness Tracker</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigateTo('(tabs)/camera' as Href<string>)}
      >
        <Text style={styles.buttonText}>Take Today's Photos</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigateTo('(tabs)/progress' as Href<string>)}
      >
        <Text style={styles.buttonText}>View Progress</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});