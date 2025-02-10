import React, { useState, useEffect } from 'react';
import { View, FlatList, Text } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Post from './Post';

export default function HashPosts({ hash }) {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const snapshot = await firestore()
                    .collection('Hash')
                    .doc(hash)
                    .collection('Posts')
                    .get();
                const postsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    networkId: doc.data().network_id,
                    postId: doc.data().post_id,
                }));
                setPosts(postsData);
            } catch (error) {
                console.warn(error);
            }
        };
        fetchPosts();
    }, [hash]);

    const renderItem = ({ item }) => (
        <Post key={item.id} post_id={item.postId} network_id={item.networkId} />
    );

    return (
        <View style={{ backgroundColor: 'black', flex: 1 }}>
        <View style={{margin: 10, backgroundColor: '#1a1a1a', padding: 10, borderRadius: 3}}>
            <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>Posts</Text>
        </View>
            <FlatList
                data={posts}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}
