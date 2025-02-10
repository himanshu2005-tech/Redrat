import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import color from './color';
import Icon from 'react-native-vector-icons/Ionicons';
import {SharedElement} from 'react-navigation-shared-element';

export default function RulesUpdate({navigation, route}) {
  const {network_id, networkDetails} = route.params;
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [ruleLoading, setRuleLoading] = useState(false);

  React.useEffect(() => {
    if (networkDetails.admin != auth().currentUser.uid) {
      navigation.popToTop();
    }
  }, [network_id, networkDetails]);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const networkDoc = await firestore()
          .collection('Network')
          .doc(network_id)
          .get();

        const rulesData = networkDoc.data().rules || [];
        setRules(rulesData);
      } catch (error) {
        console.error('Error fetching rules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [network_id]);

  const handleAddRule = async () => {
    if (!newRule.trim() || !newDescription.trim()) return;

    const updatedRules = [
      ...rules,
      {
        rule: newRule,
        description: newDescription,
        index: rules.length + 1,
        isDeactivate: false,
      },
    ];

    try {
      await firestore()
        .collection('Network')
        .doc(network_id)
        .update({rules: updatedRules});

      setRules(updatedRules);
      setNewRule('');
      setNewDescription('');
    } catch (error) {
      console.error('Error adding new rule:', error);
    }
  };

  const toggleDeactivateRule = async index => {
    const updatedRules = rules.map((ruleObj, i) => {
      if (i === index) {
        return {...ruleObj, isDeactivate: !ruleObj.isDeactivate};
      }
      return ruleObj;
    });

    try {
      await firestore()
        .collection('Network')
        .doc(network_id)
        .update({rules: updatedRules});

      setRules(updatedRules);
    } catch (error) {
      console.error('Error updating rule deactivation:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: 'row',
          padding: 10,
          gap: 7,
          alignItems: 'center',
        }}>
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.title}>Rules for Network</Text>
      </View>
      <View style={{padding: 10}}>
        

        <ScrollView style={styles.rulesContainer}>
          {loading ? (
            <Text>Loading...</Text>
          ) : !Array.isArray(rules) || rules.length === 0 ? (
            <Text>No rules available.</Text>
          ) : (
            rules.map((ruleObj, index) => (
              <View
                key={ruleObj.index || index}
                style={[
                  styles.ruleContainer,
                  ruleObj.isDeactivate && {opacity: 0.6},
                ]}>
                <View
                  style={{
                    backgroundColor: 'rgba(0,0, 0, 0.2)',
                    padding: 5,
                    borderRadius: 5,
                  }}>
                  <Text style={styles.ruleText}>{ruleObj.rule}</Text>
                  {ruleObj.isDeactivate && (
                    <Text style={styles.disabledText}>Disabled</Text>
                  )}
                </View>
                {ruleObj.description && (
                  <Text style={styles.descriptionText}>
                    {ruleObj.description}
                  </Text>
                )}
                <Pressable
                  onPress={() => toggleDeactivateRule(index)}
                  style={styles.toggleButton}>
                  <Text style={styles.toggleButtonText}>
                    {ruleObj.isDeactivate ? 'Activate' : 'Deactivate'}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>

        <TextInput
          style={styles.input}
          value={newRule}
          onChangeText={setNewRule}
          placeholder="Enter new rule"
          placeholderTextColor={'grey'}
        />

        <TextInput
          style={styles.desc}
          value={newDescription}
          onChangeText={setNewDescription}
          placeholder="Enter rule description"
          multiline
          numberOfLines={4}
          placeholderTextColor={'grey'}
        />
        <Pressable
          style={{
            backgroundColor: color,
            padding: 10,
            width: '95%',
            alignSelf: 'center',
          }}
          onPress={handleAddRule}>
          <Text
            style={{
              color: 'white',
              fontSize: 14,
              textAlign: 'center',
              fontWeight: 'bold',
            }}>
            Update Rules
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  rulesContainer: {
    marginBottom: 20,
  },
  ruleContainer: {
    marginBottom: 15,
    backgroundColor: '#1a1a1a',
    padding: 5,
    borderRadius: 5,
  },
  ruleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  descriptionText: {
    fontSize: 14,
    color: 'gray',
    marginTop: 5,
  },
  disabledText: {
    fontSize: 14,
    color: 'grey',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  input: {
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: '#1a1a1a',
    padding: 5,
    borderRadius: 5,
    color: color,
  },
  desc: {
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: '#1a1a1a',
    padding: 5,
    borderRadius: 5,
    color: color,
  },
  toggleButton: {
    backgroundColor: color,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  toggleButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
