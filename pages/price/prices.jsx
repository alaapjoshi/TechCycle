// React Components
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// For sending requests
import axios from 'axios';

// For Search Icon
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Prices() {
  // Variables to store User Input and Estimated Value
  const [userInput, setUserInput] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const serverURL = process.env.EXPO_PUBLIC_AI_SERVER_URL || 'http://127.0.0.1:3012';
  const handleEstimateValue = async () => {
    if (loading) return;
    if (!userInput.trim()) { setError('Describe a device or part first.'); return; }
    setLoading(true);
    setError('');
    setEstimatedValue('');
    try {
      const response = await axios.post(`${serverURL.replace(/\/$/, '')}/estimate`,
        { description: userInput.trim() }, { timeout: 65000 });
      if (typeof response.data.text !== 'string' || !response.data.text.trim()) throw new Error('No estimate returned.');
      setEstimatedValue(response.data.text);
    } catch (error) {
      setError(error.response?.data?.error || 'Could not reach the local AI server. Run npm run server on your Mac.');
    } finally { setLoading(false); }
  };

  return (
        <ScrollView style={{backgroundColor: '#8AE3A8'}}>
        <Text style={{textAlign: 'center', fontSize: 25, marginTop: 230}}>
            Welcome to the Price estimate Page!


        </Text>
        <Text style={{textAlign: 'center', fontSize: 18, marginTop: 20, marginBottom: 20}}>
            The more detailed the better!

        </Text>
        
    <View style={styles.iconContainer}>
    <View style={styles.container}>
      {/* Search Icon on the Left */}
      <View style={styles.iconContainer}>
        <Ionicons name="search" size={20} color="gray" />
      </View>

      {/* Search Input */}
      <TextInput
        style={styles.input}
        placeholder="ex. iPhone 11 Battery"
        onChangeText={text => setUserInput(text)}
        placeholderTextColor="gray"
      />
      
    </View>

    </View>
      <Button title={loading ? "Estimating..." : "Estimate Value"} disabled={loading} onPress={handleEstimateValue} />
      {error ? <Text accessibilityRole="alert" style={{color: '#9b1c1c', margin: 20}}>{error}</Text> : null}
      <Text style={{margin: 20}}>Approximate model estimates, not live market prices.</Text>
      <Text style={{fontSize: 20, marginLeft: 20, marginTop: 30}}>Estimated Value: {estimatedValue}</Text>
      </ScrollView>
  );
}
// CSS
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginVertical: 16,
        shadowColor: 'gray',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2, // For Android
      },
      iconContainer: {
        padding: 8,
      },
      input: {
        flex: 1,
        fontSize: 16,
        color: 'black',
      },
      cartIconContainer: {
        position: 'absolute',
        top: 30,
        right: 30,
        padding: 8,
      },
  header: {
    padding: 16,
    backgroundColor: 'skyblue',
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
  },
});