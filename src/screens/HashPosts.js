import React, { useState, useEffect } from 'react';
import { View, FlatList } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Post from './Post';

export default function HashPosts({ route }) {
    const { hash } = route.params;
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
            <FlatList
                data={posts}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}
