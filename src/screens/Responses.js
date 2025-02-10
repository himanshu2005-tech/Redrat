import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import Bluing from '../texting/Bluing';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import User from './User';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function Responses({navigation, route}) {
  const {network_id, post_id, title, response_id} = route.params;
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [reply, setReply] = useState('');
  const [repliesVisibility, setRepliesVisibility] = useState({});

  useEffect(() => {
    fetchResponses();
  }, [network_id, post_id, response_id]);

  const fetchResponses = async (loadMore = false) => {
    if (loadMore && !hasMore) return;

    loadMore ? setLoadingMore(true) : setLoading(true);

    try {
      let responsesRef = firestore()
        .collection('Posts')
        .doc(post_id)
        .collection('Responses');

      if (response_id) {
        console.log("entered")
        const snapshot = await responsesRef.doc(response_id).get();
        if (snapshot.exists) {
          setResponses([
            {
              id: snapshot.id,
              ...snapshot.data(),
            },
          ]);
        } else {
          console.error('No response found for the given response_id.');
          setResponses([]);
        }
      } else {
        responsesRef = responsesRef.orderBy('createdAt', 'desc').limit(10);
        if (loadMore && lastVisible) {
          responsesRef = responsesRef.startAfter(lastVisible);
        }
        const snapshot = await responsesRef.get();

        if (!snapshot.empty) {
          const fetchedResponses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setResponses(
            loadMore ? [...responses, ...fetchedResponses] : fetchedResponses,
          );
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      loadMore ? setLoadingMore(false) : setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore) {
      fetchResponses(true);
    }
  };

  const sendResponse = async (id, response_id) => {
    if (reply.trim() === '') return;

    console.log(id);
    console.log(reply);
    console.log(network_id, post_id);
    console.log(response_id);

    try {
      await firestore().collection('Users').doc(id).collection('Inbox').add({
        message: reply,
        createdAt: firestore.FieldValue.serverTimestamp(),
        type: 'response',
        response_id: response_id,
        network_id: network_id,
        post_id: post_id,
      });

      setReply('');
    } catch (error) {
      console.log(error);
    }
  };

  const renderFooter = () => {
    if (loadingMore) {
      return <ActivityIndicator size="small" color={color} />;
    }
    if (!hasMore) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>No more responses available</Text>
        </View>
      );
    }
    return null;
  };

  const renderSkeleton = () => (
    <SkeletonPlaceholder backgroundColor="#333" highlightColor="#444">
      <View style={styles.skeletonContainer}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonResponse} />
        <View style={styles.skeletonResponse} />
      </View>
    </SkeletonPlaceholder>
  );

  const toggleReplyVisibility = id => {
    setRepliesVisibility(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="chevron-up"
          color={color}
          size={25}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerText}>Responses</Text>
      </View>
      {title && <Bluing style={styles.postTitle} text={title} />}
      {loading && !loadingMore ? (
        renderSkeleton()
      ) : responses.length > 0 ? (
        <FlatList
          data={responses}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={styles.responseContainer}>
              <View style={styles.responseHeader}>
                <User id={item.response_by} />
                {!response_id && (
                  <Pressable onPress={() => toggleReplyVisibility(item.id)} style={{right: 5, position: 'absolute'}}>
                    <Icon name="pencil" color={color} size={20} />
                  </Pressable>
                )}
              </View>
              <Bluing style={styles.responseText} text={item.response} />
              {repliesVisibility[item.id] && (
                <View style={styles.replyContainer}>
                  <TextInput
                    value={reply}
                    onChangeText={setReply}
                    style={styles.replyInput}
                    placeholder="Enter your response"
                    placeholderTextColor="grey"
                    multiline
                    numberOfLines={4}
                    onSubmitEditing={() =>
                      sendResponse(item.response_by, item.id)
                    }
                  />
                  <Pressable
                    style={styles.sendButton}
                    onPress={() => sendResponse(item.response_by, item.id)}>
                    <Text style={styles.sendButtonText}>
                      Send Response to Inbox
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
          ListFooterComponent={renderFooter}
          onEndReached={response_id ? null : handleLoadMore}
          onEndReachedThreshold={0.75}
        />
      ) : (
        <View style={styles.noResponse}>
          <Text style={styles.noResponseText}>No response found.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'black',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    marginLeft: 10,
  },
  postTitle: {
    color: 'white',
    fontSize: 18,
    padding: 10,
  },
  responseContainer: {
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    margin: 8,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  responseText: {
    color: 'white',
    fontSize: 16,
    margin: 5
  },
  footerContainer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
  },
  skeletonContainer: {
    margin: 10,
  },
  skeletonTitle: {
    height: 20,
    width: '60%',
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonResponse: {
    height: 40,
    width: '100%',
    borderRadius: 4,
    marginBottom: 10,
  },
  replyContainer: {
    marginTop: 10,
  },
  replyInput: {
    width: '100%',
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 8,
    color: 'white',
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: color,
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 14,
  },
  noResponse: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResponseText: {
    color: 'white',
    fontSize: 16,
  },
});

