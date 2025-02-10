import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import Badge from './Badge';
import color from './color';

const BuyBadges = ({ navigation }) => {
  const [badges, setBadges] = useState({ premium: [], standard: [], basic: [] });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const badgeData = await firestore()
          .collection('Badges')
          .orderBy('minPoints')
          .get();
        const groupedBadges = {
          premium: [],
          standard: [],
          basic: [],
        };

        badgeData.docs.forEach(doc => {
          const badge = { ...doc.data(), id: doc.id };
          if (badge.minPoints >= 1000) {
            groupedBadges.premium.push(badge);
          } else if (badge.minPoints >= 500) {
            groupedBadges.standard.push(badge);
          } else {
            groupedBadges.basic.push(badge);
          }
        });

        setBadges(groupedBadges);
      } catch (error) {
        console.warn(error);
      }
    };

    fetchBadges();
  }, []);

  const renderBadgeRow = (badgeGroup, title) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={badgeGroup}
        renderItem={({ item }) => (
          <Badge badge={item} onPress={() => navigation.navigate('Badge', { badgeId: item.id })} />
        )}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      />
    </View>
  );

  return (
    <View style={{ backgroundColor: 'black', flex: 1 }}>
      <View style={{ flexDirection: 'row', padding: 10, alignItems: 'center' }}>
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
          }}
        >
          Buy Badges
        </Text>
      </View>
      <FlatList
        data={Object.keys(badges)}
        renderItem={({ item }) => renderBadgeRow(badges[item], item.charAt(0).toUpperCase() + item.slice(1))}
        keyExtractor={item => item}
        pagingEnabled
        contentContainerStyle={{width: "100%"}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    margin: 10
  },
  horizontalList: {
    paddingHorizontal: 5,
  },
});

export default BuyBadges;
