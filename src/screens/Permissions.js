import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import {check, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Icon from 'react-native-vector-icons/Ionicons';
import {openSettings} from 'react-native-permissions';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const Permissions = ({navigation}) => {
  const [permissions, setPermissions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [permission, setPermission]= useState('')

  const permissionsMap = {
    [PERMISSIONS.ANDROID.POST_NOTIFICATIONS]: 'Notification Permissions',
    [PERMISSIONS.ANDROID.READ_MEDIA_IMAGES]: 'Media Images Permissions',
    [PERMISSIONS.ANDROID.READ_MEDIA_VIDEO]: 'Media Video Permissions',
  };

  const permissionExplanations = {
    'Notification Permissions': `Granting notification permissions allows the app to keep you updated with important alerts, messages, and reminders. This ensures you don't miss out on any critical information or events.`,
    
    'Media Images Permissions': `The app needs access to your photos to enable features like uploading, sharing, and using your pictures within the app. This helps provide a more personalized and engaging experience.`,
    
    'Media Video Permissions': `Allowing access to your videos lets the app offer functionalities like video playback, uploading, and sharing. This ensures a smooth and interactive experience while using the app.`,
  };
  

  const permissionsList = Object.keys(permissionsMap);

  const fetchPermissions = async () => {
    const statuses = await Promise.all(
      permissionsList.map(async permission => {
        const status = await check(permission);
        return {name: permissionsMap[permission], status};
      }),
    );
    setPermissions(statuses);
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const formatStatus = status => {
    switch (status) {
      case RESULTS.GRANTED:
        return 'Granted';
      case RESULTS.DENIED:
        return 'Denied';
      case RESULTS.BLOCKED:
        return 'Blocked';
      case RESULTS.UNAVAILABLE:
        return 'Unavailable';
      default:
        return 'Unknown';
    }
  };

  const handlePermissionClick = permissionName => {
    setPermission(permissionName)
    setModalContent(permissionExplanations[permissionName]);
    setShowModal(true);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={{flexDirection: 'row', padding: 10, alignItems: 'center'}}>
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
          Device Permissions
        </Text>
      </View>
      {permissions.map(({name, status}, index) => (
        <Pressable
          key={index}
          style={styles.permissionItem}
          onPress={() => handlePermissionClick(name)}>
          <Text style={styles.permissionName}>{name}</Text>
          <Pressable
            style={{flexDirection: 'row', alignItems: 'center', gap: 3}}>
            <Text style={styles.permissionStatus}>{formatStatus(status)}</Text>
            <Icon name="chevron-forward" size={15} color="grey" />
          </Pressable>
        </Pressable>
      ))}

      <Modal
        transparent={true}
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{color: 'white', fontWeight: 'bold', fontSize: 20, margin: 15}}>{permission == 'Notification Permissions' && "Notification Permission"}
            {permission == 'Media Images Permissions' && "Image Access Permission"}
            {permission == 'Media Video Permissions' && "Video Access Permission"}</Text>
            <Text style={{color: 'grey', marginBottom: 20, textAlign: 'center', fontSize: 15}}>
              {modalContent}
            </Text>
            <Pressable
              style={{
                width: '90%',
                backgroundColor: '#1a1a1a',
                alignItems: 'center',
                padding: 10,
                borderRadius: 5,
              }}
              onPress={openSettings}>
              <Text style={{color: 'white'}}>Manage Permissions</Text>
            </Pressable>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowModal(false)}>
              <Text style={{color: 'white'}}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionItem: {
    padding: 15,
    backgroundColor: 'black',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionName: {
    fontWeight: 'bold',
    fontSize: 17,
    color: 'white',
  },
  permissionStatus: {
    fontSize: 13,
    color: 'grey',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'black',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: color,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    width: '90%',
  },
});

export default Permissions;
