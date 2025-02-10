import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, View, Text, Pressable, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import BotDisplay from './BotDisplay';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const MyBots = ({ navigation }) => {
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserBots = async () => {
            setLoading(true);
            try {
                const userDoc = await firestore()
                    .collection('Users')
                    .doc(auth().currentUser.uid)
                    .get();

                if (userDoc.exists) {
                    const userData = userDoc.data();
                    setBots(userData.bots || []);
                } else {
                    console.warn('User document does not exist');
                    setBots([]);
                }
            } catch (error) {
                console.warn('Error fetching user bots:', error);
                setBots([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUserBots();
    }, [navigation]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={color} size={'small'} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Pressable
                style={styles.searchBar}
                onPress={() => navigation.navigate('SearchBots')}>
                <Text style={styles.searchText}>Search bots</Text>
            </Pressable>

            {bots.length === 0 ? (
                <Text style={styles.noBotsText}>Add Bots to display</Text>
            ) : (
                <FlatList
                    data={bots}
                    renderItem={({ item }) => <BotDisplay botId={item} isActivate={false} />}
                    keyExtractor={(item) => item.toString()}
                    contentContainerStyle={{
                        justifyContent: 'space-evenly', 
                        paddingVertical: 10, 
                    }}
                    numColumns={3}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
    },
    searchBar: {
        width: '95%',
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        borderColor: 'grey',
        marginBottom: 20,
        margin: 10,
        alignSelf: 'center',
    },
    searchText: {
        color: 'grey',
        fontSize: 18,
    },
    noBotsText: {
        color: 'grey',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default MyBots;
