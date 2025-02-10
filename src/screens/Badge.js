import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import color from './color';
import { useNavigation } from '@react-navigation/native';

const {width} = Dimensions.get('window');
const Badge = ({badge}) => {
  const navigation = useNavigation()
  const getBadgeStyle = () => {
    if (badge.minPoints >= 1000) {
      return styles.premiumCard;
    } else if (badge.minPoints >= 500) {
      return styles.standardCard;
    } else {
      return styles.basicCard;
    }
  };

  const getIconStyle = () => {
    if (badge.minPoints >= 1000) {
      return styles.premiumIcon;
    } else if (badge.minPoints >= 500) {
      return styles.standardIcon;
    } else {
      return styles.basicIcon;
    }
  };

  const getButtonStyle = () => {
    if (badge.minPoints >= 1000) {
      return styles.premiumButton;
    } else if (badge.minPoints >= 500) {
      return styles.standardButton;
    } else {
      return styles.basicButton;
    }
  };

  const getGradient = () => {
    if (badge.minPoints >= 1000) {
      return ['#FFD700', '#FF8C00']; // Gold to orange gradient for premium
    } else if (badge.minPoints >= 500) {
      return ['#00BFFF', '#1E90FF']; // Light blue gradient for standard
    } else {
      return ['#333333', '#4C4C4C']; // Dark gray gradient for basic
    }
  };

  return (
    <Pressable onPress={() => navigation.push("BadgePage", {
      badge: badge
    })}>
      <LinearGradient
        colors={getGradient()}
        style={[styles.card, getBadgeStyle()]}>
        <View style={getIconStyle()}>
          <Text style={styles.iconText}>{badge.name[0]}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{badge.name}</Text>
          <Text style={styles.description}>{badge.description}</Text>
          <Text style={styles.points}>{badge.minPoints} Tribets</Text>

          <TouchableOpacity style={getButtonStyle()}>
            <Text style={styles.buttonText}>Buy Badge</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 15,
    borderRadius: 15,
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: width - 5,
    marginRight: 5,
  },
  premiumCard: {
    borderWidth: 2,
    borderColor: '#FFD700', // Gold border for premium
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  standardCard: {
    borderWidth: 1,
    borderColor: '#00BFFF', // Light blue for standard
  },
  basicCard: {
    borderWidth: 1,
    borderColor: '#333',
  },
  iconText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  premiumIcon: {
    width: 70,
    height: 70,
    backgroundColor: '#FFD700', // Gold for premium
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  standardIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#00BFFF', // Light blue for standard
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basicIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#4C4C4C', // Gray for basic
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    color: 'white',
    marginTop: 10,
    fontSize: 14,
  },
  points: {
    color: 'white',
    marginTop: 5,
    fontSize: 18,
    fontWeight: 'bold',
  },
  premiumText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 16,
  },
  buyButton: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  premiumButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  standardButton: {
    backgroundColor: '#00BFFF',
    paddingVertical: 8,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  basicButton: {
    backgroundColor: '#555555',
    paddingVertical: 6,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Badge;
