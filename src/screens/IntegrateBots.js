import React, {useState, useEffect} from 'react';
import {View, FlatList, StyleSheet, Text, Pressable} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import BotDisplay from './BotDisplay';
import Icon from 'react-native-vector-icons/Ionicons';
import MyBots from './MyBots';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function IntegrateBots({navigation, route}) {
  const {network_id, networkDetails} = route.params;
  const [bots, setBots] = useState([]);
  const [networkBots, setNetworkBots] = useState(new Set());

  React.useEffect(() => {
    if(networkDetails.admin != auth().currentUser.uid){
      navigation.popToTop();
    }
  }, [network_id, networkDetails])

  useEffect(() => {
    const fetchBots = async () => {
      try {
        const userBotsData = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .get();
        setBots(userBotsData.data().bots || []);

        const networkData = await firestore()
          .collection('Network')
          .doc(network_id)
          .get();
        setNetworkBots(new Set(networkData.data().bots || []));
      } catch (error) {
        console.warn(error);
      }
    };
    fetchBots();
  }, [network_id]);

  const toggleBotInNetwork = async botId => {
    const updatedBots = new Set(networkBots);
    updatedBots.has(botId) ? updatedBots.delete(botId) : updatedBots.add(botId);

    try {
      await firestore()
        .collection('Network')
        .doc(network_id)
        .update({bots: Array.from(updatedBots)});
      setNetworkBots(updatedBots);
    } catch (error) {
      console.warn('Error updating Firestore:', error);
    }
  };

  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View
        style={{
          flexDirection: 'row',
          padding: 10,
          gap: 7,
          borderBottomWidth: 0.7,
          borderColor: '#1a1a1a',
        }}>
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text
          style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: 18,
            marginLeft: 10,
          }}>
          Integrate Bots
        </Text>
      </View>
      <FlatList
        data={bots}
        renderItem={({item}) => (
          <BotDisplay
            botId={item}
            isActive={networkBots.has(item)}
            onToggle={() => toggleBotInNetwork(item)}
            isActivate={true}
          />
        )}
        keyExtractor={item => item.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={(
            <View>
                <Text style={{color: 'grey', fontSize: 16, textAlign: 'center'}}>Buy Bots to integrate to this network</Text>
                <Pressable style={{backgroundColor: '#1a1a1a', width: "80%", alignSelf: 'center', padding: 10, marginTop: 10, borderRadius: 10, alignItems: 'center'}} onPress={() => navigation.replace("MyBots")}>
                    <Text style={{color: 'white', fontSize: 16}}>Shop bots</Text>
                </Pressable>
            </View>
        )}
        numColumns={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    justifyContent: 'space-evenly',
    paddingVertical: 10,
  },
});
