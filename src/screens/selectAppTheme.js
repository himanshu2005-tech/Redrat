import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { setColor, getColor } from './color';

const SelectAppTheme = ({ navigation }) => {
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    const initializeColor = async () => {
      const currentColor = getColor(); // Get the current color
      setSelectedColor(currentColor || '#FF3131'); // Default if no color is set
    };
    initializeColor();
  }, []);

  const saveColor = async () => {
    if (selectedColor.trim() === '') {
      Alert.alert('Error', 'Please enter a valid color.');
      return;
    }
    try {
      await setColor(selectedColor); // Save the color using `setColor`
      Alert.alert('Success', 'Color saved successfully!');
      navigation.goBack(); // Navigate back after saving
    } catch (error) {
      Alert.alert('Error', 'Failed to save color.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select App Theme Color</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter a color (e.g., #5D3FD3)"
        value={selectedColor}
        onChangeText={setSelectedColor}
      />
      <TouchableOpacity style={[styles.button, { backgroundColor: selectedColor || '#5D3FD3' }]} onPress={saveColor}>
        <Text style={styles.buttonText}>Save Color</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SelectAppTheme;
